import type { DateRange, UserDto } from '../types/contracts';
import type { InsightSource, LeaderboardSourceRow } from '../types/analytics';
import { readSnapshot } from '../lib/db/readSnapshot';
import { User } from '../models/User';
import { Habit } from '../models/Habit';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { toUserDto, toHabitDto, toCheckInDto } from '../lib/dto';
import { AppError } from '../lib/http';
import { dateRangeKeys, todayInZone, validateWritableDate } from '../lib/dates';
import { rowsForDate } from './habitEligibility';
import { streakHistory } from './streakService';
import { completionOf } from './completion';
import { completionProjection } from './checkInService';
export async function loadInsightSource(
  user: UserDto,
  range: DateRange,
): Promise<InsightSource> {
  return readSnapshot(async (session) => {
    const stored = await User.findById(user.id).session(session);
    if (!stored)
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    const fresh = toUserDto(stored);
    validateWritableDate(range.to, fresh.timezone);
    const checkIns = (
      await DailyCheckIn.find({ userId: user.id })
        .sort({ localDate: 1 })
        .session(session)
    ).map((r) => toCheckInDto(r));
    const habits = (await Habit.find({ userId: user.id }).session(session)).map(
      toHabitDto,
    );
    const byDate = new Map(checkIns.map((c) => [c.localDate, c]));
    const eligibleHabitsByDate: InsightSource['eligibleHabitsByDate'] = {};
    for (const date of dateRangeKeys(range.from, range.to))
      eligibleHabitsByDate[date] = rowsForDate(
        habits,
        date,
        fresh.timezone,
        byDate.get(date)?.habitCompletions,
      ).map((h) => ({ habitId: h.habitId, name: h.habitNameSnapshot }));
    return {
      range,
      today: todayInZone(fresh.timezone),
      goals: fresh.goals,
      checkIns,
      eligibleHabitsByDate,
    };
  });
}
export async function loadLeaderboardSource(
  viewer: UserDto,
): Promise<LeaderboardSourceRow[]> {
  return readSnapshot(async (session) => {
    const users = await User.find({ role: 'user', leaderboardEnabled: true })
      .select('displayName timezone')
      .session(session)
      .lean();
    const records = await DailyCheckIn.find({
      userId: { $in: users.map((u) => u._id) },
    })
      .select('userId ' + completionProjection + ' pointAwards.points')
      .session(session)
      .lean();
    const grouped = new Map<string, typeof records>();
    for (const record of records) {
      const key = String(record.userId);
      const rows = grouped.get(key) ?? [];
      rows.push(record);
      grouped.set(key, rows);
    }
    return users.map((user) => {
      const key = String(user._id);
      const history = grouped.get(key) ?? [];
      return {
        displayName: user.displayName,
        points: history.reduce(
          (sum, r) => sum + r.pointAwards.reduce((n, a) => n + a.points, 0),
          0,
        ),
        currentStreak: streakHistory(
          history.map((r) => ({
            localDate: r.localDate,
            completion: completionOf(r),
          })),
          todayInZone(user.timezone),
        ).current,
        isCurrentUser: key === viewer.id,
        tieBreakKey: key,
      };
    });
  });
}
