import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, account, request } from './support';
import { seedPointRules, seedAdmin } from '../../services/seedService';
import {
  writeCheckIn,
  getCheckIn,
  deleteCheckIn,
} from '../../services/checkInService';
import { createHabit } from '../../services/habitService';
import { PointRule } from '../../models/PointRule';
import { DailyCheckIn } from '../../models/DailyCheckIn';
import { User } from '../../models/User';
import { todayInZone, shiftDate } from '../../lib/dates';
import { withUserTransaction } from '../../lib/db/transaction';
import {
  POST as createRule,
  GET as listRules,
} from '../../app/api/admin/point-rules/route';
import {
  PATCH as patchRule,
  DELETE as removeRule,
} from '../../app/api/admin/point-rules/[id]/route';
import { GET as triggers } from '../../app/api/admin/point-triggers/route';
beforeAll(prepareDatabase);
beforeEach(async () => {
  await clearDatabase();
  await seedPointRules();
});
afterAll(() => mongoose.disconnect());
const today = () => todayInZone('Asia/Bangkok');
const complete = {
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
it('awards each trigger once, handles zero habits, and reverses disqualified awards', async () => {
  const { user } = await account();
  let record = await writeCheckIn(user.id, undefined, {
    localDate: today(),
    ...complete,
  });
  expect(record.pointsEarned).toBe(18);
  expect(
    record.pointAwards.some(
      (a) => a.triggerKey === 'ALL_DAILY_HABITS_COMPLETE',
    ),
  ).toBe(false);
  const h = await createHabit(user.id, { name: 'Walk' });
  record = await writeCheckIn(user.id, today(), {
    habitCompletions: [{ habitId: h.id, completed: true }],
  });
  expect(record.pointsEarned).toBe(26);
  await Promise.all([
    writeCheckIn(user.id, today(), { waterMl: 2000 }),
    writeCheckIn(user.id, today(), { mood: 4 }),
  ]);
  const again = await getCheckIn(user.id, today());
  expect(again.pointAwards).toEqual(record.pointAwards);
  record = await writeCheckIn(user.id, today(), {
    waterMl: null,
    habitCompletions: [],
  });
  expect(record.pointsEarned).toBe(5);
  expect(record.completion).toBe('partial');
  record = await writeCheckIn(user.id, today(), { waterMl: 0 });
  expect(record.completedFieldCount).toBe(9);
  expect(record.pointsEarned).toBe(15);
});
it('preserves qualifying historical values across edits, disabling, deletion, and repricing', async () => {
  const { user } = await account();
  await writeCheckIn(user.id, undefined, { localDate: today(), waterMl: 2000 });
  await PointRule.updateOne(
    { triggerKey: 'WATER_GOAL_REACHED' },
    { $set: { points: 99, enabled: false } },
  );
  expect((await writeCheckIn(user.id, today(), { mood: 4 })).pointsEarned).toBe(
    3,
  );
  await PointRule.deleteOne({ triggerKey: 'WATER_GOAL_REACHED' });
  expect((await writeCheckIn(user.id, today(), { mood: 3 })).pointsEarned).toBe(
    3,
  );
  expect(
    (await writeCheckIn(user.id, today(), { waterMl: 0 })).pointsEarned,
  ).toBe(0);
  expect(
    (await writeCheckIn(user.id, today(), { waterMl: 2000 })).pointsEarned,
  ).toBe(0);
  await seedPointRules();
  await PointRule.updateOne(
    { triggerKey: 'WATER_GOAL_REACHED' },
    { $set: { points: 9 } },
  );
  expect(
    (await writeCheckIn(user.id, today(), { waterMl: 2000 })).pointsEarned,
  ).toBe(9);
});
it('moves and removes streak milestones after historical backfills and deletion without repricing unrelated awards', async () => {
  const { user } = await account();
  const start = shiftDate(today(), -29);
  // Historical fixtures have identical completion but no awards until explicitly reconciled.
  await DailyCheckIn.insertMany(
    Array.from({ length: 29 }, (_, i) => ({
      userId: user.id,
      localDate: shiftDate(start, i + 1),
      ...complete,
    })),
  );
  const end = await writeCheckIn(user.id, today(), { mood: 4 });
  expect(end.currentStreak).toBe(29);
  expect(
    end.pointAwards.some((a) => a.triggerKey === 'CHECKIN_STREAK_30'),
  ).toBe(false);
  const first = await writeCheckIn(user.id, undefined, {
    localDate: start,
    ...complete,
  });
  expect(first.currentStreak).toBe(30);
  expect(
    (await getCheckIn(user.id, today())).pointAwards.find(
      (a) => a.triggerKey === 'CHECKIN_STREAK_30',
    )?.points,
  ).toBe(50);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 6))).pointAwards.find(
      (a) => a.triggerKey === 'CHECKIN_STREAK_7',
    )?.points,
  ).toBe(20);
  await PointRule.updateOne(
    { triggerKey: 'WATER_GOAL_REACHED' },
    { $set: { points: 88 } },
  );
  await deleteCheckIn(user.id, start);
  expect(
    (await getCheckIn(user.id, today())).pointAwards.some(
      (a) => a.triggerKey === 'CHECKIN_STREAK_30',
    ),
  ).toBe(false);
  expect(
    (await getCheckIn(user.id, today())).pointAwards.find(
      (a) => a.triggerKey === 'WATER_GOAL_REACHED',
    )?.points,
  ).toBe(3);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 6))).pointAwards.some(
      (a) => a.triggerKey === 'CHECKIN_STREAK_7',
    ),
  ).toBe(false);
  expect(
    (await getCheckIn(user.id, shiftDate(start, 7))).pointAwards.find(
      (a) => a.triggerKey === 'CHECKIN_STREAK_7',
    )?.points,
  ).toBe(20);
});
it('rolls back record and serialization state together on a failed transaction', async () => {
  const { user } = await account();
  await expect(
    withUserTransaction(user.id, async (u, session) => {
      await DailyCheckIn.create([{ userId: u._id, localDate: today() }], {
        session,
      });
      throw new Error('rollback');
    }),
  ).rejects.toThrow('rollback');
  expect(await DailyCheckIn.countDocuments({ userId: user.id })).toBe(0);
  expect((await User.findById(user.id))?.mutationRevision).toBe(0);
});
it('guards admin CRUD, immutable keys, uniqueness, and safe trigger metadata', async () => {
  const member = await account();
  const admin = await account('Operator', true);
  expect(
    (
      await listRules(
        request('/admin/point-rules', 'GET', undefined, member.cookie),
      )
    ).status,
  ).toBe(403);
  expect((await triggers(request('/admin/point-triggers'))).status).toBe(401);
  const metadata = (
    await (
      await triggers(
        request('/admin/point-triggers', 'GET', undefined, admin.cookie),
      )
    ).json()
  ).data;
  expect(metadata).toHaveLength(8);
  expect(Object.keys(metadata[0])).toEqual(['key', 'label', 'description']);
  expect(
    (
      await createRule(
        request(
          '/admin/point-rules',
          'POST',
          { triggerKey: 'WATER_GOAL_REACHED', points: 4, enabled: true },
          admin.cookie,
        ),
      )
    ).status,
  ).toBe(409);
  const rule = (await PointRule.findOne({ triggerKey: 'WATER_GOAL_REACHED' }))!;
  const context = { params: Promise.resolve({ id: String(rule._id) }) };
  expect(
    (
      await patchRule(
        request(
          '/admin/point-rules/' + rule.id,
          'PATCH',
          { triggerKey: 'SLEEP_GOAL_REACHED' },
          admin.cookie,
        ),
        context,
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await patchRule(
        request(
          '/admin/point-rules/' + rule.id,
          'PATCH',
          { points: 101 },
          admin.cookie,
        ),
        context,
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await patchRule(
        request(
          '/admin/point-rules/' + rule.id,
          'PATCH',
          { points: 7, enabled: false },
          admin.cookie,
        ),
        context,
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await removeRule(
        request(
          '/admin/point-rules/' + rule.id,
          'DELETE',
          undefined,
          admin.cookie,
        ),
        context,
      )
    ).status,
  ).toBe(204);
  expect(
    (
      await createRule(
        request(
          '/admin/point-rules',
          'POST',
          { triggerKey: 'WATER_GOAL_REACHED', points: 4, enabled: true },
          admin.cookie,
        ),
      )
    ).status,
  ).toBe(201);
});
it('seeds idempotently, preserves rule configuration, and promotes an existing operator without resetting the password', async () => {
  const rule = (await PointRule.findOne({ triggerKey: 'WATER_GOAL_REACHED' }))!;
  rule.points = 7;
  rule.enabled = false;
  await rule.save();
  const timestamp = rule.updatedAt.toISOString();
  await seedPointRules();
  const after = (await PointRule.findById(rule._id))!;
  expect(after.points).toBe(7);
  expect(after.enabled).toBe(false);
  expect(after.updatedAt.toISOString()).toBe(timestamp);
  expect(await PointRule.countDocuments()).toBe(8);
  const { user } = await account('Operator');
  const hash = (await User.findById(user.id).select('+passwordHash'))!
    .passwordHash;
  await seedAdmin({
    email: user.email,
    displayName: 'Operator',
    password: 'different-password',
    timezone: 'UTC',
  });
  const stored = (await User.findById(user.id).select('+passwordHash'))!;
  expect(stored.role).toBe('admin');
  expect(stored.leaderboardEnabled).toBe(false);
  expect(stored.passwordHash).toBe(hash);
});
