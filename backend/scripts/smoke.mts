import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { z } from 'zod';
import {
  successEnvelope,
  userDtoSchema,
  checkInDtoSchema,
  habitDtoSchema,
  pointRuleDtoSchema,
  pointTriggerDtoSchema,
  insightsDtoSchema,
  leaderboardEntrySchema,
  DEFAULT_GOALS,
} from '../src/types/contracts';
import { todayInZone, shiftDate } from '../src/lib/dates';
config({ path: process.argv[2] ?? '.env.docker.local', quiet: true });
const origin = process.env.APP_ORIGIN!;
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
  'Stack smoke tests require a local origin.',
);
const prefix =
  process.env.PUBLIC_BASE_PATH === '/' ? '' : process.env.PUBLIC_BASE_PATH!;
const api = origin + prefix + '/api';
async function response(
  path: string,
  method = 'GET',
  body?: unknown,
  cookie?: string,
  expected = 200,
) {
  const r = await fetch(api + path, {
    method,
    headers: {
      Origin: origin,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal(r.status, expected, `${method} ${path} returned ${r.status}`);
  if (expected === 204) assert.equal(await r.text(), '');
  return r;
}
async function data<T extends z.ZodType>(r: Response, schema: T) {
  const envelope = successEnvelope(schema).parse(await r.json()) as {
    data: z.output<T>;
  };
  return envelope.data;
}
const suffix = randomUUID().slice(0, 8),
  password = randomUUID() + randomUUID();
const date = todayInZone('Asia/Bangkok');
await response('/health');
await response('/health/ready');
const page = await fetch(origin + prefix + '/calendar');
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes(prefix + '/assets/'));
const script = html.match(/src="([^"]+\.js)"/)?.[1];
assert.ok(script);
assert.equal((await fetch(origin + script)).status, 200);
assert.equal((await fetch(origin + prefix + '/assets/missing.js')).status, 404);
assert.equal((await fetch(origin + prefix + '/brand-mark.svg')).status, 200);
const registration = await response(
  '/auth/register',
  'POST',
  {
    email: `smoke-${suffix}@example.invalid`,
    password,
    displayName: 'Local check ' + suffix,
    timezone: 'Asia/Bangkok',
  },
  undefined,
  201,
);
const user = await data(registration, userDtoSchema);
let cookie = registration.headers.get('set-cookie')!.split(';')[0];
const attributes = registration.headers.get('set-cookie')!;
assert.ok(
  attributes.includes('HttpOnly') &&
    attributes.includes('Secure') &&
    attributes.includes('SameSite=Lax') &&
    attributes.includes('Path=' + prefix),
);
await response('/auth/me', 'GET', undefined, undefined, 401);
await response('/admin/point-rules', 'GET', undefined, cookie, 403);
const hostile = await fetch(api + '/users/me', {
  method: 'PATCH',
  headers: {
    Cookie: cookie,
    Origin: 'https://untrusted.example',
    'Content-Type': 'application/json',
  },
  body: '{"displayName":"Changed"}',
});
assert.equal(hostile.status, 403);
await response(
  '/auth/login',
  'POST',
  { email: user.email, password: 'incorrect' },
  undefined,
  401,
);
const logged = await response('/auth/login', 'POST', {
  email: user.email,
  password,
});
cookie = logged.headers.get('set-cookie')!.split(';')[0];
const habit = await data(
  await response('/habits', 'POST', { name: 'Walk' }, cookie, 201),
  habitDtoSchema,
);
let checkIn = await data(
  await response('/check-ins', 'POST', { localDate: date }, cookie, 201),
  checkInDtoSchema,
);
assert.equal(checkIn.completedFieldCount, 0);
assert.equal(checkIn.pointsEarned, 0);
await response('/check-ins', 'POST', { localDate: date }, cookie, 409);
await response('/check-ins/' + date, 'PATCH', { pointAwards: [] }, cookie, 400);
const complete = {
  sleep: { durationMinutes: 480, quality: 'good' },
  waterMl: 2000,
  mood: 4,
  meals: {
    breakfast: { status: 'eaten' },
    lunch: { status: 'skipped' },
    dinner: { status: 'eaten' },
    snacks: [{ description: 'Apple' }],
  },
  alcoholStatus: 'none',
  bowelStatus: 'normal',
  habitCompletions: [{ habitId: habit.id, completed: true }],
};
checkIn = await data(
  await response('/check-ins/' + date, 'PATCH', complete, cookie),
  checkInDtoSchema,
);
assert.equal(checkIn.pointsEarned, 26);
assert.equal(checkIn.currentStreak, 1);
await Promise.all([
  response('/check-ins/' + date, 'PATCH', { mood: 5 }, cookie),
  response('/check-ins/' + date, 'PATCH', { waterMl: 2100 }, cookie),
]);
const after = await data(
  await response('/check-ins/' + date, 'GET', undefined, cookie),
  checkInDtoSchema,
);
assert.equal(after.mood, 5);
assert.equal(after.waterMl, 2100);
assert.equal(after.pointsEarned, 26);
assert.deepEqual(after.pointAwards, checkIn.pointAwards);
const other = await response(
  '/auth/register',
  'POST',
  {
    email: `other-${suffix}@example.invalid`,
    password,
    displayName: 'Other local check',
    timezone: 'UTC',
  },
  undefined,
  201,
);
const otherCookie = other.headers.get('set-cookie')!.split(';')[0];
await response('/check-ins/' + date, 'GET', undefined, otherCookie, 404);
await response(
  '/habits/' + habit.id,
  'PATCH',
  { name: 'Intrusion' },
  otherCookie,
  404,
);
await data(
  await response(
    '/users/me',
    'PATCH',
    { goals: { ...DEFAULT_GOALS, waterMl: 2500 }, leaderboardEnabled: false },
    cookie,
  ),
  userDtoSchema,
);
const insights = await data(
  await response(
    '/insights?from=' + shiftDate(date, -1) + '&to=' + date,
    'GET',
    undefined,
    cookie,
  ),
  insightsDtoSchema,
);
assert.equal(insights.dayCount, 2);
assert.equal(insights.summary.totalPoints, 26);
assert.equal(insights.summary.waterGoalRate, 0);
assert.equal(insights.days[0].waterMl, null);
let rows = await data(
  await response('/leaderboard', 'GET', undefined, cookie),
  z.array(leaderboardEntrySchema),
);
assert.equal(
  rows.some((r) => r.isCurrentUser),
  false,
);
await response('/users/me', 'PATCH', { leaderboardEnabled: true }, cookie);
rows = await data(
  await response('/leaderboard', 'GET', undefined, cookie),
  z.array(leaderboardEntrySchema),
);
assert.equal(rows.find((r) => r.isCurrentUser)?.points, 26);
const operator = await response('/auth/login', 'POST', {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
});
const adminCookie = operator.headers.get('set-cookie')!.split(';')[0];
const rules = await data(
  await response('/admin/point-rules', 'GET', undefined, adminCookie),
  z.array(pointRuleDtoSchema),
);
assert.equal(
  (
    await data(
      await response('/admin/point-triggers', 'GET', undefined, adminCookie),
      z.array(pointTriggerDtoSchema),
    )
  ).length,
  8,
);
const water = rules.find((r) => r.triggerKey === 'WATER_GOAL_REACHED')!;
assert.ok(water);
try {
  await response(
    '/admin/point-rules/' + water.id,
    'PATCH',
    { points: water.points + 1 },
    adminCookie,
  );
  const repriced = await data(
    await response('/check-ins/' + date, 'PATCH', { mood: 4 }, cookie),
    checkInDtoSchema,
  );
  assert.equal(repriced.pointsEarned, 23); // Current water goal disqualifies only that award.
} finally {
  await response(
    '/admin/point-rules/' + water.id,
    'PATCH',
    { points: water.points, enabled: water.enabled },
    adminCookie,
  );
}
await response('/habits/' + habit.id, 'DELETE', undefined, cookie, 204);
assert.equal(
  (
    await data(
      await response('/habits', 'GET', undefined, cookie),
      z.array(habitDtoSchema),
    )
  ).length,
  0,
);
await response('/check-ins/' + date, 'DELETE', undefined, cookie, 204);
await response('/check-ins/' + date, 'GET', undefined, cookie, 404);
await response('/users/me', 'PATCH', { leaderboardEnabled: false }, cookie);
await response(
  '/users/me',
  'PATCH',
  { leaderboardEnabled: false },
  otherCookie,
);
const out = await response('/auth/logout', 'POST', undefined, cookie, 204);
assert.ok(out.headers.get('set-cookie')!.includes('Max-Age=0'));
console.log(
  'Stack smoke passed: routing, assets, sessions, ownership, CRUD, scoring, concurrency, insights, privacy, and administration.',
);
