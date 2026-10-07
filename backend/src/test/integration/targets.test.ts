import { beforeAll, beforeEach, afterAll, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase } from './support';
import { registerUser, updateProfile } from '../../services/authService';
import { seedPointRules } from '../../services/seedService';
import { writeCheckIn, getCheckIn } from '../../services/checkInService';
import { computeInsights } from '../../services/insightService';
import { loadInsightSource } from '../../services/analyticsSource';
import { todayInZone } from '../../lib/dates';
import { DEFAULT_GOALS } from '../../types/contracts';
beforeAll(prepareDatabase);
beforeEach(async () => {
  await clearDatabase();
  await seedPointRules();
});
afterAll(() => mongoose.disconnect());
it('registers without targets or a timezone field and allows all targets to be removed without treating null as a zero goal', async () => {
  let user = await registerUser({
    email: 'no-target@example.com',
    password: 'password123',
    displayName: 'No targets',
  });
  expect(user.timezone).toBe('Asia/Bangkok');
  expect(user.goals).toEqual(DEFAULT_GOALS);
  const date = todayInZone('Asia/Bangkok');
  const fields = {
    sleep: { durationMinutes: 480, quality: 'good' },
    waterMl: 2000,
    mood: 4,
    meals: {
      breakfast: { status: 'eaten' },
      lunch: { status: 'skipped' },
      dinner: { status: 'eaten' },
      snacks: [],
    },
    alcoholStatus: 'none',
    bowelStatus: 'normal',
  };
  expect(
    (await writeCheckIn(user.id, undefined, { localDate: date, ...fields }))
      .pointsEarned,
  ).toBe(12);
  user = await updateProfile(user.id, {
    goals: { ...DEFAULT_GOALS, sleepHours: 8, waterMl: 2000 },
  });
  expect((await writeCheckIn(user.id, date, { mood: 4 })).pointsEarned).toBe(
    18,
  );
  user = await updateProfile(user.id, { goals: DEFAULT_GOALS });
  expect((await getCheckIn(user.id, date)).pointsEarned).toBe(18);
  expect((await writeCheckIn(user.id, date, { mood: 4 })).pointsEarned).toBe(
    12,
  );
  const insights = computeInsights(
    await loadInsightSource(user, { from: date, to: date }),
  );
  expect(insights.summary.sleepGoalRate).toBeNull();
  expect(insights.summary.waterGoalRate).toBeNull();
  expect(insights.summary.averageWaterMl).toBe(2000);
  const cleared = await writeCheckIn(user.id, date, {
    sleep: { durationMinutes: null, quality: null },
    waterMl: null,
    mood: null,
    meals: {
      breakfast: { status: 'not_logged' },
      lunch: { status: 'not_logged' },
      dinner: { status: 'not_logged' },
      snacks: [],
    },
    alcoholStatus: null,
    bowelStatus: null,
    habitCompletions: [],
  });
  expect(cleared.completedFieldCount).toBe(0);
  expect(cleared.pointsEarned).toBe(0);
  await expect(updateProfile(user.id, { timezone: 'UTC' })).rejects.toThrow();
});
it('accepts selected onboarding targets while leaving the rest unset', async () => {
  const user = await registerUser({
    email: 'targets@example.com',
    password: 'password123',
    displayName: 'Targets',
    goals: { ...DEFAULT_GOALS, sleepHours: 7, waterMl: 1500 },
  });
  expect(user.goals).toMatchObject({
    sleepHours: 7,
    waterMl: 1500,
    mealsPerDay: null,
    targetMood: null,
    targetBowelStatus: null,
  });
});
