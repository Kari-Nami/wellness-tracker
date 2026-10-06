import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, account, request } from './support';
import { seedDemoAccounts } from '../../services/demoSeedService';
import { createSession } from '../../lib/auth/session';
import { GET as listRules } from '../../app/api/admin/point-rules/route';
import { seedPointRules } from '../../services/seedService';
import { loginUser } from '../../services/authService';
import { writeCheckIn, getCheckIn } from '../../services/checkInService';
import { User } from '../../models/User';
import { Habit } from '../../models/Habit';
import { DailyCheckIn } from '../../models/DailyCheckIn';
import { DEMO_ACCOUNTS } from '../../types/demoAccounts';
import { todayInZone, shiftDate } from '../../lib/dates';
import {
  loadInsightSource,
  loadLeaderboardSource,
} from '../../services/analyticsSource';
import { computeInsights } from '../../services/insightService';
import { buildLeaderboard } from '../../services/leaderboardService';
beforeAll(prepareDatabase);
beforeEach(async () => {
  await clearDatabase();
  await seedPointRules();
});
afterAll(() => mongoose.disconnect());
it('seeds rich member accounts and an authentic administrator with no public leaderboard row', async () => {
  await seedDemoAccounts();
  expect(await User.countDocuments()).toBe(4);
  expect(await Habit.countDocuments()).toBe(9);
  for (const demo of DEMO_ACCOUNTS) {
    const user = await loginUser({
      email: demo.email,
      password: demo.password,
    });
    expect(user.role).toBe(demo.role);
    if (demo.role === 'admin') {
      expect(user.leaderboardEnabled).toBe(false);
      const result = await listRules(
        request(
          '/admin/point-rules',
          'GET',
          undefined,
          'wellness_session=' + (await createSession(user)),
        ),
      );
      expect(result.status).toBe(200);
      expect((await result.json()).data).toHaveLength(8);
      continue;
    }
    expect(user).not.toHaveProperty('demoKey');
    expect(user).not.toHaveProperty('demoHabitIds');
    const today = todayInZone(user.timezone);
    const source = await loadInsightSource(user, {
      from: shiftDate(today, -89),
      to: today,
    });
    const data = computeInsights(source);
    expect(data.recordedDayCount).toBeGreaterThan(75);
    expect(data.completeDayCount).toBeGreaterThan(65);
    expect(data.summary.totalPoints).toBeGreaterThan(1000);
    expect(data.habits).toHaveLength(3);
    expect(data.days.some((d) => d.completion === 'missing')).toBe(true);
    expect(new Set(data.days.map((d) => d.waterMl)).size).toBeGreaterThan(5);
    if (demo.key === 'maya') {
      expect(data.summary.currentStreak).toBe(30);
      expect(
        (await getCheckIn(user.id, today)).pointAwards.some(
          (a) => a.triggerKey === 'CHECKIN_STREAK_30',
        ),
      ).toBe(true);
    }
  }
  const user = await loginUser({
    email: DEMO_ACCOUNTS[0].email,
    password: DEMO_ACCOUNTS[0].password,
  });
  const rows = buildLeaderboard(await loadLeaderboardSource(user));
  expect(rows).toHaveLength(3);
  expect(rows.filter((r) => r.isCurrentUser)).toHaveLength(1);
  expect(rows.every((r) => r.points > 1000)).toBe(true);
});
it('preserves demo edits, renamed habits, personal data, and award identities on repeat seeds', async () => {
  const personal = await account();
  await writeCheckIn(personal.user.id, undefined, {
    localDate: todayInZone('Asia/Bangkok'),
    waterMl: 1234,
  });
  await seedDemoAccounts();
  const demo = await loginUser({
    email: DEMO_ACCOUNTS[0].email,
    password: DEMO_ACCOUNTS[0].password,
  });
  const today = todayInZone(demo.timezone);
  await writeCheckIn(demo.id, today, { waterMl: 777 });
  const before = await getCheckIn(demo.id, today);
  const h = (await Habit.findOne({ userId: demo.id }))!;
  h.name = 'Renamed routine';
  await h.save();
  const count = await DailyCheckIn.countDocuments();
  await seedDemoAccounts();
  expect((await getCheckIn(demo.id, today)).waterMl).toBe(777);
  expect((await getCheckIn(demo.id, today)).pointAwards).toEqual(
    before.pointAwards,
  );
  expect(await Habit.countDocuments({ userId: demo.id })).toBe(3);
  expect((await Habit.findById(h._id))?.name).toBe('Renamed routine');
  expect(await DailyCheckIn.countDocuments()).toBe(count);
  expect((await getCheckIn(personal.user.id, today)).waterMl).toBe(1234);
});
it('refuses to modify an unmarked account with a matching public demo address', async () => {
  const personal = await account();
  await User.updateOne(
    { _id: personal.user.id },
    { $set: { email: DEMO_ACCOUNTS[0].email } },
  );
  await expect(seedDemoAccounts()).rejects.toThrow('existing personal account');
  expect((await User.findById(personal.user.id))?.demoKey).toBeUndefined();
  expect(await Habit.countDocuments()).toBe(0);
});
