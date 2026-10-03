import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { mockFetch } from './server';
import { resetDemoData, getDatabase } from './store';
import {
  checkInDtoSchema,
  insightsDtoSchema,
  leaderboardEntrySchema,
  successEnvelope,
} from '../types/contracts';
import { z } from 'zod';
import { todayInZone } from '../lib/dates';
async function call(path: string, method = 'GET', body?: unknown) {
  const result = mockFetch(`/api${path}`, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  await vi.runAllTimersAsync();
  return result;
}
async function login(admin = false) {
  const response = await call('/auth/login', 'POST', {
    email: admin ? 'admin@example.com' : 'alex@example.com',
    password: 'wellness123',
  });
  expect(response.status).toBe(200);
}
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-08T05:00:00.000Z'));
  resetDemoData();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('demo API integration', () => {
  it('requires a session and denies member access to scoring configuration', async () => {
    expect((await call('/auth/me')).status).toBe(401);
    await login();
    expect((await call('/admin/point-rules')).status).toBe(403);
  });
  it('validates all populated read responses against the integration contract', async () => {
    await login();
    const today = todayInZone(getDatabase().accounts[0].user.timezone);
    const checkIn = await call(`/check-ins/${today}`);
    expect(
      successEnvelope(checkInDtoSchema).safeParse(await checkIn.json()).success,
    ).toBe(true);
    const insights = await call(`/insights?from=${today}&to=${today}`);
    expect(
      successEnvelope(insightsDtoSchema).safeParse(await insights.json())
        .success,
    ).toBe(true);
    const leaderboard = await call('/leaderboard');
    expect(
      successEnvelope(z.array(leaderboardEntrySchema)).safeParse(
        await leaderboard.json(),
      ).success,
    ).toBe(true);
  });
  it('preserves explicit zero, rejects forged writes, and leaves data unchanged after rejected mutations', async () => {
    await login();
    const db = getDatabase();
    const user = db.accounts[0].user;
    const today = todayInZone(user.timezone);
    const update = await call(`/check-ins/${today}`, 'PATCH', { waterMl: 0 });
    expect((await update.json()).data.waterMl).toBe(0);
    expect(
      (
        await call(`/check-ins/${today}`, 'PATCH', {
          waterMl: 700,
          pointAwards: [],
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call(`/check-ins/${today}`, 'PATCH', {
          waterMl: 700,
          habitCompletions: [
            { habitId: 'ffffffffffffffffffffffff', completed: true },
          ],
        })
      ).status,
    ).toBe(400);
    expect(db.records[user.id][today].waterMl).toBe(0);
  });
  it('keeps award identities idempotent and preserves historical values after a rule change', async () => {
    await login();
    const db = getDatabase();
    const user = db.accounts[0].user;
    const today = todayInZone(user.timezone);
    await call(`/check-ins/${today}`, 'PATCH', { waterMl: 2000 });
    const before = structuredClone(db.records[user.id][today].pointAwards);
    await call(`/check-ins/${today}`, 'PATCH', { waterMl: 2000 });
    expect(db.records[user.id][today].pointAwards).toEqual(before);
    await login(true);
    const rule = db.rules.find((r) => r.triggerKey === 'WATER_GOAL_REACHED')!;
    await call(`/admin/point-rules/${rule.id}`, 'PATCH', {
      points: 25,
      enabled: false,
    });
    await login();
    await call(`/check-ins/${today}`, 'PATCH', { waterMl: 2000 });
    expect(
      db.records[user.id][today].pointAwards.find(
        (a) => a.triggerKey === 'WATER_GOAL_REACHED',
      )?.points,
    ).toBe(3);
  });
  it('starts registered members empty and never exposes private leaderboard fields', async () => {
    const created = await call('/auth/register', 'POST', {
      email: 'new@example.com',
      password: 'samplepass',
      displayName: 'New member',
      timezone: 'Asia/Bangkok',
    });
    expect(created.status).toBe(201);
    expect((await created.json()).data.role).toBe('user');
    const today = todayInZone('Asia/Bangkok');
    const insights = await call(`/insights?from=${today}&to=${today}`);
    const dto = successEnvelope(insightsDtoSchema).parse(
      await insights.json(),
    ).data;
    expect(dto.recordedDayCount).toBe(0);
    expect(dto.summary.averageSleepMinutes).toBeNull();
    const rows = successEnvelope(z.array(leaderboardEntrySchema)).parse(
      await (await call('/leaderboard')).json(),
    ).data;
    expect(rows.some((r) => r.isCurrentUser && r.points === 0)).toBe(true);
    expect(rows.every((r) => !('email' in r) && !('id' in r))).toBe(true);
  });
  it('rejects future writes and duplicate check-ins', async () => {
    await login();
    expect(
      (await call('/check-ins', 'POST', { localDate: '2099-01-01' })).status,
    ).toBe(400);
    const today = todayInZone(getDatabase().accounts[0].user.timezone);
    expect(
      (await call('/check-ins', 'POST', { localDate: today })).status,
    ).toBe(409);
  });
});
