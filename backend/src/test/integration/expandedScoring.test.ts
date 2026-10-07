import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, account } from './support';
import { seedPointRules } from '../../services/seedService';
import { updateProfile } from '../../services/authService';
import {
  writeCheckIn,
  getCheckIn,
  deleteCheckIn,
} from '../../services/checkInService';
import { PointRule } from '../../models/PointRule';
import { todayInZone, shiftDate } from '../../lib/dates';
import { DEFAULT_GOALS } from '../../types/contracts';
beforeAll(prepareDatabase);
beforeEach(async () => {
  await clearDatabase();
  await seedPointRules();
});
afterAll(() => mongoose.disconnect());
const today = () => todayInZone('Asia/Bangkok');
it('separates logging from target and meal bonuses, preserves award identities, and removes only disqualified awards', async () => {
  const { user } = await account();
  await updateProfile(user.id, {
    goals: {
      ...user.goals,
      targetMood: 4,
      targetBowelStatus: 'normal',
      mealsPerDay: 4,
    },
  });
  let record = await writeCheckIn(user.id, undefined, {
    localDate: today(),
    waterMl: 0,
    sleep: { durationMinutes: 0, quality: null },
    mood: 1,
    bowelStatus: 'none',
    meals: {
      breakfast: { status: 'skipped' },
      lunch: { status: 'eaten' },
      dinner: { status: 'not_logged' },
      snacks: [{ description: 'Apple' }],
    },
  });
  expect(record.pointsEarned).toBe(6);
  expect(
    record.pointAwards.filter((a) => a.triggerKey.endsWith('GOAL_REACHED')),
  ).toEqual([]);
  record = await writeCheckIn(user.id, today(), {
    waterMl: 2000,
    sleep: { durationMinutes: 480, quality: 'good' },
    mood: 5,
    bowelStatus: 'normal',
    alcoholStatus: 'none',
    meals: {
      breakfast: { status: 'eaten' },
      lunch: { status: 'eaten' },
      dinner: { status: 'eaten' },
      snacks: [{ description: 'Apple' }],
    },
  });
  expect(record.pointsEarned).toBe(39);
  const awards = record.pointAwards;
  expect(
    (await writeCheckIn(user.id, today(), { mood: 5 })).pointAwards,
  ).toEqual(awards);
  expect(new Set(awards.map((a) => a.instanceKey)).size).toBe(awards.length);
  await updateProfile(user.id, { goals: DEFAULT_GOALS });
  expect((await getCheckIn(user.id, today())).pointAwards).toEqual(awards);
  record = await writeCheckIn(user.id, today(), { mood: 5 });
  expect(record.pointsEarned).toBe(24);
  expect(
    record.pointAwards.filter((a) => a.triggerKey.endsWith('GOAL_REACHED')),
  ).toEqual([]);
  record = await writeCheckIn(user.id, today(), {
    meals: { ...record.meals, lunch: { status: 'skipped' } },
  });
  expect(record.pointsEarned).toBe(19);
  expect(
    record.pointAwards.some((a) => a.triggerKey === 'ALL_MAIN_MEALS_EATEN'),
  ).toBe(false);
  expect(
    record.pointAwards.filter((a) => a.triggerKey === 'MEAL_LOGGED'),
  ).toHaveLength(3);
});
it('counts alcohol-only entries, repairs 7/10/30-day milestones after missing dates, and respects disabled and repriced rules', async () => {
  const { user } = await account();
  const start = shiftDate(today(), -29);
  for (let i = 0; i < 30; i++)
    await writeCheckIn(user.id, undefined, {
      localDate: shiftDate(start, i),
      alcoholStatus: 'none',
    });
  for (const [offset, points] of [
    [6, 22],
    [9, 32],
    [29, 52],
  ])
    expect(
      (await getCheckIn(user.id, shiftDate(start, offset))).pointsEarned,
    ).toBe(points);
  const original = (await getCheckIn(user.id, today())).pointAwards;
  expect(
    (await writeCheckIn(user.id, today(), { alcoholStatus: 'none' }))
      .pointAwards,
  ).toEqual(original);
  await PointRule.updateOne(
    { triggerKey: 'ALCOHOL_FREE_STREAK_30' },
    { $set: { enabled: false, points: 99 } },
  );
  expect(
    (await writeCheckIn(user.id, today(), { waterMl: 0 })).pointAwards.find(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30',
    )?.points,
  ).toBe(50);
  await deleteCheckIn(user.id, shiftDate(start, 4));
  expect(
    (await getCheckIn(user.id, today())).pointAwards.some(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30',
    ),
  ).toBe(false);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 6))).pointAwards.some(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_7',
    ),
  ).toBe(false);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 11))).pointAwards.find(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_7',
    )?.points,
  ).toBe(20);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 14))).pointAwards.find(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_10',
    )?.points,
  ).toBe(30);
  await writeCheckIn(user.id, undefined, {
    localDate: shiftDate(start, 4),
    alcoholStatus: 'none',
  });
  expect(
    (await getCheckIn(user.id, today())).pointAwards.some(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30',
    ),
  ).toBe(false);
  await PointRule.updateOne(
    { triggerKey: 'ALCOHOL_FREE_STREAK_30' },
    { $set: { enabled: true } },
  );
  expect(
    (
      await writeCheckIn(user.id, today(), { alcoholStatus: 'none' })
    ).pointAwards.find((a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30')
      ?.points,
  ).toBe(99);
  await writeCheckIn(user.id, shiftDate(start, 4), { alcoholStatus: 'light' });
  expect(
    (await getCheckIn(user.id, today())).pointAwards.some(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30',
    ),
  ).toBe(false);
});
it('does not mint unrelated past milestone awards when new rules are seeded', async () => {
  await PointRule.deleteMany({
    triggerKey: {
      $in: [
        'ALCOHOL_FREE_STREAK_7',
        'ALCOHOL_FREE_STREAK_10',
        'ALCOHOL_FREE_STREAK_30',
      ],
    },
  });
  const { user } = await account();
  const start = shiftDate(today(), -29);
  for (let i = 0; i < 30; i++)
    await writeCheckIn(user.id, undefined, {
      localDate: shiftDate(start, i),
      alcoholStatus: 'none',
    });
  await seedPointRules();
  await writeCheckIn(user.id, today(), { mood: 4 });
  expect(
    (await getCheckIn(user.id, today())).pointAwards.find(
      (a) => a.triggerKey === 'ALCOHOL_FREE_STREAK_30',
    )?.points,
  ).toBe(50);
  for (const offset of [6, 9])
    expect(
      (await getCheckIn(user.id, shiftDate(start, offset))).pointAwards.filter(
        (a) => a.triggerKey.startsWith('ALCOHOL_FREE_STREAK_'),
      ),
    ).toEqual([]);
  await writeCheckIn(user.id, shiftDate(start, 3), { waterMl: 0 });
  for (const offset of [6, 9])
    expect(
      (await getCheckIn(user.id, shiftDate(start, offset))).pointAwards.filter(
        (a) => a.triggerKey.startsWith('ALCOHOL_FREE_STREAK_'),
      ),
    ).toEqual([]);
});
