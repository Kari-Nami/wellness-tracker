import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, account, request } from './support';
import { POST as create, GET as list } from '../../app/api/check-ins/route';
import {
  GET as get,
  PATCH as patch,
  DELETE as remove,
} from '../../app/api/check-ins/[localDate]/route';
import { writeCheckIn, getCheckIn } from '../../services/checkInService';
import {
  createHabit,
  updateHabit,
  archiveHabit,
  listHabits,
} from '../../services/habitService';
import { Habit } from '../../models/Habit';
import { todayInZone, shiftDate } from '../../lib/dates';
import { checkInDtoSchema, successEnvelope } from '../../types/contracts';
beforeAll(prepareDatabase);
beforeEach(clearDatabase);
afterAll(() => mongoose.disconnect());
const today = () => todayInZone('Asia/Bangkok');
const context = (date: string) => ({
  params: Promise.resolve({ localDate: date }),
});
it('persists explicit zero and none, leaves unlogged fields empty, and rejects duplicates and future dates', async () => {
  const { cookie } = await account();
  const result = await create(
    request(
      '/check-ins',
      'POST',
      { localDate: today(), waterMl: 0, alcoholStatus: 'none' },
      cookie,
    ),
  );
  expect(result.status).toBe(201);
  const dto = successEnvelope(checkInDtoSchema).parse(await result.json()).data;
  expect(dto.completedFieldCount).toBe(2);
  expect(dto.sleep.durationMinutes).toBeNull();
  expect(dto.completion).toBe('partial');
  expect(
    (
      await create(
        request('/check-ins', 'POST', { localDate: today() }, cookie),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await create(
        request(
          '/check-ins',
          'POST',
          { localDate: shiftDate(today(), 1) },
          cookie,
        ),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await create(
        request(
          '/check-ins',
          'POST',
          { localDate: shiftDate(today(), -1), pointAwards: [] },
          cookie,
        ),
      )
    ).status,
  ).toBe(400);
});
it('checks ownership, replacement semantics, missing records, and inclusive calendar ranges', async () => {
  const a = await account();
  const b = await account('Other');
  const date = today();
  await writeCheckIn(a.user.id, undefined, { localDate: date, waterMl: 0 });
  expect(
    (
      await get(
        request('/check-ins/' + date, 'GET', undefined, b.cookie),
        context(date),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await patch(
        request('/check-ins/' + date, 'PATCH', { waterMl: 100 }, b.cookie),
        context(date),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await remove(
        request('/check-ins/' + date, 'DELETE', undefined, b.cookie),
        context(date),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await patch(
        request('/check-ins/' + date, 'PATCH', {}, a.cookie),
        context(date),
      )
    ).status,
  ).toBe(400);
  const responses = await Promise.all([
    patch(
      request('/check-ins/' + date, 'PATCH', { waterMl: 100 }, a.cookie),
      context(date),
    ),
    patch(
      request('/check-ins/' + date, 'PATCH', { mood: 4 }, a.cookie),
      context(date),
    ),
  ]);
  expect(responses.map((r) => r.status)).toEqual([200, 200]);
  const dto = await getCheckIn(a.user.id, date);
  expect(dto.waterMl).toBe(100);
  expect(dto.mood).toBe(4);
  const response = await list(
    request(
      '/check-ins?from=' +
        shiftDate(date, -1) +
        '&to=' +
        shiftDate(date, 1) +
        '&view=summary',
      'GET',
      undefined,
      a.cookie,
    ),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).data).toHaveLength(1);
  expect(
    (
      await remove(
        request('/check-ins/' + date, 'DELETE', undefined, a.cookie),
        context(date),
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await get(
        request('/check-ins/' + date, 'GET', undefined, a.cookie),
        context(date),
      )
    ).status,
  ).toBe(404);
});
it('retains historical snapshots while normalizing current eligibility and validates submitted habit ownership', async () => {
  const a = await account();
  const b = await account('Other');
  const h = await createHabit(a.user.id, { name: 'Original' });
  const alien = await createHabit(b.user.id, { name: 'Other' });
  await Habit.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(h.id) },
    { $set: { createdAt: new Date('2020-01-01') } },
  );
  const yesterday = shiftDate(today(), -1);
  await writeCheckIn(a.user.id, undefined, {
    localDate: yesterday,
    habitCompletions: [{ habitId: h.id, completed: true }],
  });
  await updateHabit(a.user.id, h.id, { name: 'Renamed' });
  await archiveHabit(a.user.id, h.id);
  const old = await writeCheckIn(a.user.id, yesterday, { waterMl: 100 });
  expect(old.habitCompletions[0]).toMatchObject({
    habitNameSnapshot: 'Original',
    completed: true,
  });
  const current = await writeCheckIn(a.user.id, undefined, {
    localDate: today(),
  });
  expect(current.habitCompletions).toEqual([]);
  await expect(
    writeCheckIn(a.user.id, today(), {
      habitCompletions: [{ habitId: alien.id, completed: true }],
    }),
  ).rejects.toMatchObject({ status: 400 });
  expect(await listHabits(a.user.id, false)).toHaveLength(0);
  expect(await listHabits(a.user.id, true)).toHaveLength(1);
  await expect(
    updateHabit(a.user.id, h.id, { active: true }),
  ).rejects.toMatchObject({ status: 409 });
});
it('enforces the active habit limit even for concurrent creation', async () => {
  const { user } = await account();
  for (let i = 0; i < 9; i++)
    await createHabit(user.id, { name: 'Habit ' + i });
  const results = await Promise.allSettled([
    createHabit(user.id, { name: 'Ten' }),
    createHabit(user.id, { name: 'Eleven' }),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(await Habit.countDocuments({ userId: user.id, active: true })).toBe(
    10,
  );
  const paused = await createHabit(user.id, { name: 'Paused', active: false });
  await expect(
    updateHabit(user.id, paused.id, { active: true }),
  ).rejects.toMatchObject({ status: 409 });
});
