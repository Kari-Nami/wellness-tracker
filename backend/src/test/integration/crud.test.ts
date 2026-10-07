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
  deleteHabit,
  getHabit,
  listHabits,
} from '../../services/habitService';
import { Habit } from '../../models/Habit';
import { seedPointRules } from '../../services/seedService';
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
  await deleteHabit(a.user.id, h.id);
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
  expect(await listHabits(a.user.id)).toHaveLength(0);
  await expect(getHabit(a.user.id, h.id)).rejects.toMatchObject({
    status: 404,
  });
  const { GET: listHabitRoute } = await import('../../app/api/habits/route');
  const listed = await listHabitRoute(
    request('/habits?includeArchived=true', 'GET', undefined, a.cookie),
  );
  expect((await listed.json()).data).toEqual([]);
  await expect(
    updateHabit(a.user.id, h.id, { active: true }),
  ).rejects.toMatchObject({ status: 404 });
});
it('allows more than ten active habits, concurrent additions, resuming, and check-ins with more than one hundred habit rows', async () => {
  await seedPointRules();
  const { user } = await account();
  for (let i = 0; i < 15; i++)
    await createHabit(user.id, { name: 'Habit ' + i });
  await Promise.all([
    createHabit(user.id, { name: 'Sixteen' }),
    createHabit(user.id, { name: 'Seventeen' }),
  ]);
  const paused = await createHabit(user.id, { name: 'Paused', active: false });
  await updateHabit(user.id, paused.id, { active: true });
  expect(await listHabits(user.id)).toHaveLength(18);
  await Habit.insertMany(
    Array.from({ length: 85 }, (_, i) => ({
      userId: user.id,
      name: 'Extra ' + i,
    })),
  );
  const habits = await listHabits(user.id);
  const record = await writeCheckIn(user.id, undefined, {
    localDate: today(),
    habitCompletions: habits.map((h) => ({ habitId: h.id, completed: true })),
  });
  expect(checkInDtoSchema.parse(record).habitCompletions).toHaveLength(103);
  expect(
    record.pointAwards.filter((a) => a.triggerKey === 'HABIT_COMPLETE'),
  ).toHaveLength(103);
});
it('accepts a 12000 ml reading and rejects values above the water and sleep limits', async () => {
  const { user } = await account();
  const record = await writeCheckIn(user.id, undefined, {
    localDate: today(),
    waterMl: 12000,
    sleep: { durationMinutes: 1440, quality: 'good' },
  });
  expect(record.waterMl).toBe(12000);
  expect(record.sleep.durationMinutes).toBe(1440);
  await expect(
    writeCheckIn(user.id, today(), { waterMl: 12001 }),
  ).rejects.toBeDefined();
  await expect(
    writeCheckIn(user.id, today(), {
      sleep: { durationMinutes: 1441, quality: 'good' },
    }),
  ).rejects.toBeDefined();
  expect((await getCheckIn(user.id, today())).waterMl).toBe(12000);
});
