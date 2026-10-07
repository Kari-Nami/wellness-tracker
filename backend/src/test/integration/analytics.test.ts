import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, account, request } from './support';
import { seedPointRules } from '../../services/seedService';
import { writeCheckIn } from '../../services/checkInService';
import { createHabit, updateHabit } from '../../services/habitService';
import { updateProfile } from '../../services/authService';
import { Habit } from '../../models/Habit';
import { todayInZone, shiftDate } from '../../lib/dates';
import { GET as insights } from '../../app/api/insights/route';
import { GET as leaderboard } from '../../app/api/leaderboard/route';
import {
  insightsDtoSchema,
  successEnvelope,
  DEFAULT_GOALS,
} from '../../types/contracts';
beforeAll(prepareDatabase);
beforeEach(async () => {
  await clearDatabase();
  await seedPointRules();
});
afterAll(() => mongoose.disconnect());
const today = () => todayInZone('Asia/Bangkok');
it('emits every calendar day and uses logged values, eligible pairs, and stored awards for its denominators', async () => {
  const { user, cookie } = await account();
  const h = await createHabit(user.id, { name: 'Walk' });
  await Habit.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(h.id) },
    { $set: { createdAt: new Date('2020-01-01') } },
  );
  const from = shiftDate(today(), -2);
  await writeCheckIn(user.id, undefined, {
    localDate: from,
    sleep: { durationMinutes: 0, quality: 'poor' },
    waterMl: 0,
    alcoholStatus: 'none',
    habitCompletions: [{ habitId: h.id, completed: true }],
  });
  await writeCheckIn(user.id, undefined, {
    localDate: today(),
    sleep: { durationMinutes: 480, quality: 'good' },
    waterMl: 2000,
    mood: 4,
    meals: {
      breakfast: { status: 'skipped' },
      lunch: { status: 'eaten' },
      dinner: { status: 'skipped' },
      snacks: [],
    },
    alcoholStatus: 'heavy',
    bowelStatus: 'normal',
    habitCompletions: [{ habitId: h.id, completed: true }],
  });
  const response = await insights(
    request(
      '/insights?from=' + from + '&to=' + today(),
      'GET',
      undefined,
      cookie,
    ),
  );
  expect(response.status).toBe(200);
  const dto = successEnvelope(insightsDtoSchema).parse(
    await response.json(),
  ).data;
  expect(dto.dayCount).toBe(3);
  expect(dto.recordedDayCount).toBe(2);
  expect(dto.completeDayCount).toBe(1);
  expect(dto.days[1]).toMatchObject({
    completion: 'missing',
    sleepMinutes: null,
    waterMl: null,
    mood: null,
    habitsEligible: 1,
    habitsCompleted: 0,
  });
  expect(dto.summary).toMatchObject({
    averageSleepMinutes: 240,
    sleepGoalRate: 50,
    averageWaterMl: 1000,
    waterGoalRate: 50,
    averageMood: 4,
    totalPoints: 45,
    currentStreak: 1,
    longestStreak: 1,
  });
  expect(dto.summary.habitCompletionRate).toBeCloseTo(200 / 3);
  expect(dto.summary.mealLoggingRate).toBeCloseTo(100 / 3);
  expect(dto.alcoholDistribution).toEqual({
    none: 1,
    light: 0,
    heavy: 1,
    blackout: 0,
    notLogged: 1,
  });
  await updateHabit(user.id, h.id, { name: 'Evening walk' });
  await updateProfile(user.id, { goals: { ...DEFAULT_GOALS, waterMl: 3000 } });
  const changed = successEnvelope(insightsDtoSchema).parse(
    await (
      await insights(
        request(
          '/insights?from=' + from + '&to=' + today(),
          'GET',
          undefined,
          cookie,
        ),
      )
    ).json(),
  ).data;
  expect(changed.summary.waterGoalRate).toBe(0);
  expect(changed.summary.totalPoints).toBe(45);
  expect(changed.habits[0].name).toBe('Evening walk');
  const subset = successEnvelope(insightsDtoSchema).parse(
    await (
      await insights(
        request(
          '/insights?from=' + from + '&to=' + from,
          'GET',
          undefined,
          cookie,
        ),
      )
    ).json(),
  ).data;
  expect(subset.habits[0].name).toBe('Walk');
  expect(subset.summary.currentStreak).toBe(1);
});
it('returns null for zero-denominator averages and rejects future and oversized insight ranges', async () => {
  const { cookie } = await account();
  const response = await insights(
    request(
      '/insights?from=' + today() + '&to=' + today(),
      'GET',
      undefined,
      cookie,
    ),
  );
  const dto = successEnvelope(insightsDtoSchema).parse(
    await response.json(),
  ).data;
  expect(dto.summary).toMatchObject({
    averageSleepMinutes: null,
    averageWaterMl: null,
    averageMood: null,
    sleepGoalRate: null,
    waterGoalRate: null,
    habitCompletionRate: null,
    checkInCompletionRate: 0,
    mealLoggingRate: 0,
  });
  expect(
    (
      await insights(
        request(
          '/insights?from=' + today() + '&to=' + shiftDate(today(), 1),
          'GET',
          undefined,
          cookie,
        ),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await insights(
        request(
          '/insights?from=' + shiftDate(today(), -365) + '&to=' + today(),
          'GET',
          undefined,
          cookie,
        ),
      )
    ).status,
  ).toBe(400);
});
it('ranks zero-score participants, hides opted-out members and operators, and exposes only public fields', async () => {
  const viewer = await account('Same');
  const other = await account('Other');
  await account('Operator', true);
  await writeCheckIn(other.user.id, undefined, {
    localDate: today(),
    waterMl: 2000,
  });
  const response = await leaderboard(
    request('/leaderboard', 'GET', undefined, viewer.cookie),
  );
  expect(response.status).toBe(200);
  const rows = (await response.json()).data;
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    rank: 1,
    displayName: 'Other',
    points: 4,
    isCurrentUser: false,
  });
  expect(rows[1]).toMatchObject({
    rank: 2,
    displayName: 'Same',
    points: 0,
    isCurrentUser: true,
  });
  expect(Object.keys(rows[0]).sort()).toEqual([
    'currentStreak',
    'displayName',
    'isCurrentUser',
    'points',
    'rank',
  ]);
  await updateProfile(viewer.user.id, { leaderboardEnabled: false });
  expect(
    (
      await (
        await leaderboard(
          request('/leaderboard', 'GET', undefined, viewer.cookie),
        )
      ).json()
    ).data,
  ).toHaveLength(1);
  expect((await leaderboard(request('/leaderboard'))).status).toBe(401);
});
