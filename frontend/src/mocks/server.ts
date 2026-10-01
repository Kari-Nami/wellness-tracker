import { ZodError } from 'zod';
import { apiBaseUrl } from '../config/app';
import {
  DEFAULT_GOALS,
  registerInputSchema,
  loginInputSchema,
  profilePatchSchema,
  createCheckInInputSchema,
  checkInPatchSchema,
  habitInputSchema,
  habitPatchSchema,
  pointRuleInputSchema,
  pointRulePatchSchema,
  dateRangeSchema,
  localDateSchema,
  idSchema,
  type UserDto,
  type CheckInDto,
} from '../types/contracts';
import { emptyCheckIn } from '../features/checkIn/model';
import { todayInZone } from '../lib/dates';
import { triggerDefinitions, makeId } from './data';
import {
  getDatabase,
  getDemoSession,
  setDemoSession,
  persistDatabase,
  passwordDigest,
} from './store';
import {
  currentStreak,
  demoInsights,
  reconcile,
  relevantHabits,
} from './calculations';
class DemoError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const response = (data: unknown, status = 200) =>
  Response.json({ data }, { status });
const deleted = () => new Response(null, { status: 204 });
const fail = (status: number, code: string, message: string): never => {
  throw new DemoError(status, code, message);
};
function actingUser(): UserDto {
  return (
    getDatabase().accounts.find(
      (account) => account.user.id === getDemoSession(),
    )?.user ?? fail(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  );
}
function adminUser() {
  const user = actingUser();
  if (user.role !== 'admin')
    fail(403, 'FORBIDDEN', 'This page is available to administrators only.');
  return user;
}
function recordFor(user: UserDto, date: string) {
  return (
    getDatabase().records[user.id]?.[date] ??
    fail(404, 'NOT_FOUND', 'No check-in has been recorded for this day.')
  );
}
function eligibleRows(user: UserDto, date: string, record?: CheckInDto) {
  const eligible = relevantHabits(
    getDatabase().habits[user.id] ?? [],
    date,
    user.timezone,
  );
  const rows = [...(record?.habitCompletions ?? [])];
  for (const habit of eligible)
    if (!rows.some((h) => h.habitId === habit.id))
      rows.push({
        habitId: habit.id,
        habitNameSnapshot: habit.name,
        completed: false,
      });
  return rows;
}
function range(url: URL, insights = false) {
  const value = dateRangeSchema.parse({
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  });
  if (insights && value.to > todayInZone(actingUser().timezone))
    fail(400, 'VALIDATION_ERROR', 'Choose a range ending today or earlier.');
  return value;
}
async function dispatch(
  url: URL,
  method: string,
  payload: unknown,
): Promise<Response> {
  const path = url.pathname.slice(apiBaseUrl.length);
  const db = getDatabase();
  const now = new Date().toISOString();
  if (path === '/auth/logout' && method === 'POST') {
    setDemoSession(null);
    return deleted();
  }
  if (path === '/auth/register' && method === 'POST') {
    const input = registerInputSchema.parse(payload);
    if (db.accounts.some((a) => a.user.email === input.email))
      fail(409, 'CONFLICT', 'That email is already registered.');
    const user: UserDto = {
      id: makeId(),
      email: input.email,
      displayName: input.displayName,
      timezone: input.timezone,
      role: 'user',
      goals: { ...DEFAULT_GOALS },
      leaderboardEnabled: true,
      createdAt: now,
      updatedAt: now,
    };
    db.accounts.push({
      user,
      passwordHash: await passwordDigest(input.password),
    });
    db.records[user.id] = {};
    db.habits[user.id] = [];
    setDemoSession(user.id);
    persistDatabase();
    return response(user, 201);
  }
  if (path === '/auth/login' && method === 'POST') {
    const input = loginInputSchema.parse(payload);
    const digest = await passwordDigest(input.password);
    const account =
      db.accounts.find(
        (a) => a.user.email === input.email && a.passwordHash === digest,
      ) ??
      fail(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
    setDemoSession(account.user.id);
    return response(account.user);
  }
  const user = actingUser();
  if ((path === '/auth/me' || path === '/users/me') && method === 'GET')
    return response(user);
  if (path === '/users/me' && method === 'PATCH') {
    Object.assign(user, profilePatchSchema.parse(payload), { updatedAt: now });
    persistDatabase();
    return response(user);
  }
  if (path === '/check-ins' && method === 'GET') {
    const { from, to } = range(url);
    const records = Object.values(db.records[user.id] ?? {})
      .filter((r) => r.localDate >= from && r.localDate <= to)
      .sort((a, b) => a.localDate.localeCompare(b.localDate));
    return response(
      url.searchParams.get('view') === 'summary'
        ? records.map(({ localDate, completion, pointsEarned }) => ({
            localDate,
            completion,
            pointsEarned,
          }))
        : records,
    );
  }
  if (
    (path === '/check-ins' && method === 'POST') ||
    (path.startsWith('/check-ins/') &&
      ['GET', 'PATCH', 'DELETE'].includes(method))
  ) {
    const create = method === 'POST';
    const input = create
      ? createCheckInInputSchema.parse(payload)
      : method === 'PATCH'
        ? checkInPatchSchema.parse(payload)
        : undefined;
    const localDate = localDateSchema.parse(
      create
        ? input && 'localDate' in input
          ? input.localDate
          : ''
        : path.split('/')[2],
    );
    if (localDate > todayInZone(user.timezone))
      fail(400, 'VALIDATION_ERROR', 'Future dates cannot be logged.');
    if (method === 'GET') {
      const record = recordFor(user, localDate);
      return response({
        ...record,
        habitCompletions: eligibleRows(user, localDate, record),
        currentStreak: currentStreak(
          db.records[user.id],
          todayInZone(user.timezone),
        ),
      });
    }
    if (method === 'DELETE') {
      recordFor(user, localDate);
      delete db.records[user.id][localDate];
      reconcile(db, user, localDate);
      persistDatabase();
      return deleted();
    }
    if (create && db.records[user.id]?.[localDate])
      fail(409, 'CONFLICT', 'This date already has a check-in.');
    const record: CheckInDto = create
      ? {
          ...emptyCheckIn(),
          id: makeId(),
          localDate,
          habitCompletions: eligibleRows(user, localDate),
          completion: 'partial',
          completedFieldCount: 0,
          requiredFieldCount: 9,
          pointAwards: [],
          pointsEarned: 0,
          currentStreak: 0,
          createdAt: now,
          updatedAt: now,
        }
      : recordFor(user, localDate);
    if (input) {
      const { habitCompletions, ...fields } = input;
      Object.assign(record, fields, { updatedAt: now });
      if (habitCompletions) {
        const rows = eligibleRows(user, localDate, record);
        for (const completion of habitCompletions) {
          const owned = (db.habits[user.id] ?? []).some(
            (h) => h.id === completion.habitId,
          );
          if (!owned || !rows.some((h) => h.habitId === completion.habitId))
            fail(
              400,
              'VALIDATION_ERROR',
              'One of these habits is not available for this day.',
            );
        }
        record.habitCompletions = rows.map((h) => ({
          ...h,
          completed:
            habitCompletions.find((c) => c.habitId === h.habitId)?.completed ??
            false,
        }));
      }
    }
    db.records[user.id] ??= {};
    db.records[user.id][localDate] = record;
    reconcile(db, user, localDate);
    persistDatabase();
    return response(record, create ? 201 : 200);
  }
  if (path === '/habits' && method === 'GET')
    return response(
      (db.habits[user.id] ?? []).filter(
        (h) =>
          url.searchParams.get('includeArchived') === 'true' || !h.deletedAt,
      ),
    );
  if (path === '/habits' && method === 'POST') {
    const input = habitInputSchema.parse(payload);
    const habits = (db.habits[user.id] ??= []);
    if (
      input.active !== false &&
      habits.filter((h) => h.active && !h.deletedAt).length >= 10
    )
      fail(409, 'CAPACITY_REACHED', 'You can have up to ten active habits.');
    const habit = {
      id: makeId(),
      name: input.name,
      description: input.description ?? '',
      active: input.active ?? true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    habits.push(habit);
    persistDatabase();
    return response(habit, 201);
  }
  if (path.startsWith('/habits/')) {
    const id = idSchema.parse(path.split('/')[2]);
    const habit =
      (db.habits[user.id] ?? []).find((h) => h.id === id) ??
      fail(404, 'NOT_FOUND', 'This habit could not be found.');
    if (method === 'GET') return response(habit);
    if (method === 'DELETE') {
      habit.active = false;
      habit.deletedAt = now;
      habit.updatedAt = now;
      persistDatabase();
      return deleted();
    }
    if (method === 'PATCH') {
      const input = habitPatchSchema.parse(payload);
      if (habit.deletedAt)
        fail(409, 'CONFLICT', 'An archived habit cannot be edited.');
      if (
        input.active &&
        !habit.active &&
        (db.habits[user.id] ?? []).filter((h) => h.active && !h.deletedAt)
          .length >= 10
      )
        fail(409, 'CAPACITY_REACHED', 'You can have up to ten active habits.');
      Object.assign(habit, input, { updatedAt: now });
      persistDatabase();
      return response(habit);
    }
  }
  if (path === '/insights' && method === 'GET')
    return response(demoInsights(db, user, range(url, true)));
  if (path === '/leaderboard' && method === 'GET') {
    const peers = [
      { displayName: 'Jamie Chen', points: 1620, currentStreak: 24 },
      { displayName: 'Sofia Rivera', points: 1450, currentStreak: 19 },
      { displayName: 'Jordan Lee', points: 1150, currentStreak: 14 },
      { displayName: 'Riley Bennett', points: 980, currentStreak: 8 },
      { displayName: 'Charlie Park', points: 850, currentStreak: 11 },
      { displayName: 'Taylor Ellis', points: 720, currentStreak: 6 },
      { displayName: 'Robin Carter', points: 610, currentStreak: 4 },
    ].map((row) => ({ ...row, isCurrentUser: false }));
    const participants = db.accounts
      .filter((a) => a.user.role === 'user' && a.user.leaderboardEnabled)
      .map(({ user: participant }) => ({
        displayName: participant.displayName,
        points: Object.values(db.records[participant.id] ?? {}).reduce(
          (n, r) => n + r.pointsEarned,
          0,
        ),
        currentStreak: currentStreak(
          db.records[participant.id] ?? {},
          todayInZone(participant.timezone),
        ),
        isCurrentUser: participant.id === user.id,
      }));
    return response(
      [...peers, ...participants]
        .sort(
          (a, b) =>
            b.points - a.points || a.displayName.localeCompare(b.displayName),
        )
        .map((row, index) => ({ ...row, rank: index + 1 })),
    );
  }
  if (path.startsWith('/admin/')) {
    adminUser();
    if (path === '/admin/point-triggers' && method === 'GET')
      return response(triggerDefinitions);
    if (path === '/admin/point-rules' && method === 'GET')
      return response(db.rules);
    if (path === '/admin/point-rules' && method === 'POST') {
      const input = pointRuleInputSchema.parse(payload);
      if (db.rules.some((r) => r.triggerKey === input.triggerKey))
        fail(409, 'CONFLICT', 'This trigger already has a rule.');
      const rule = { ...input, id: makeId(), createdAt: now, updatedAt: now };
      db.rules.push(rule);
      persistDatabase();
      return response(rule, 201);
    }
    if (path.startsWith('/admin/point-rules/')) {
      const id = idSchema.parse(path.split('/')[3]);
      const rule =
        db.rules.find((r) => r.id === id) ??
        fail(404, 'NOT_FOUND', 'This rule could not be found.');
      if (method === 'PATCH') {
        Object.assign(rule, pointRulePatchSchema.parse(payload), {
          updatedAt: now,
        });
        persistDatabase();
        return response(rule);
      }
      if (method === 'DELETE') {
        db.rules = db.rules.filter((r) => r.id !== id);
        persistDatabase();
        return deleted();
      }
    }
  }
  return fail(404, 'NOT_FOUND', 'This resource could not be found.');
}
export async function mockFetch(
  input: string,
  options: RequestInit = {},
): Promise<Response> {
  await new Promise<void>((resolve, reject) => {
    const aborted = () => {
      clearTimeout(timer);
      reject(new DOMException('The request was cancelled.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      options.signal?.removeEventListener('abort', aborted);
      resolve();
    }, 130);
    if (options.signal?.aborted) aborted();
    else options.signal?.addEventListener('abort', aborted, { once: true });
  });
  try {
    const payload: unknown = options.body
      ? JSON.parse(String(options.body))
      : undefined;
    return await dispatch(
      new URL(input, window.location.origin),
      options.method ?? 'GET',
      payload,
    );
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues[0]?.message ?? 'Please check your input.',
            details: { issues: error.issues },
          },
        },
        { status: 400 },
      );
    if (error instanceof DemoError)
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'The demo could not complete this request. Try resetting the sample data.',
        },
      },
      { status: 500 },
    );
  }
}
