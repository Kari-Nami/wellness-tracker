import type { ClientSession } from 'mongoose';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { Habit } from '../models/Habit';
import { User } from '../models/User';
import { toCheckInDto, toHabitDto } from '../lib/dto';
import { withUserTransaction } from '../lib/db/transaction';
import { readSnapshot } from '../lib/db/readSnapshot';
import { AppError } from '../lib/http';
import { todayInZone, validateWritableDate } from '../lib/dates';
import {
  checkInPatchSchema,
  createCheckInInputSchema,
  localDateSchema,
  dateRangeSchema,
  checkInSummarySchema,
  type DateRange,
} from '../types/contracts';
import { completionOf } from './completion';
import { streakHistory } from './streakService';
import { rowsForDate } from './habitEligibility';
export const completionProjection =
  'localDate sleep waterMl mood meals.breakfast.status meals.lunch.status meals.dinner.status alcoholStatus bowelStatus';
export async function loadCurrentStreak(
  userId: string,
  timezone: string,
  session: ClientSession,
) {
  const history = await DailyCheckIn.find({ userId })
    .select(completionProjection)
    .session(session)
    .lean();
  return streakHistory(
    history.map((r) => ({
      localDate: r.localDate,
      completion: completionOf(r),
    })),
    todayInZone(timezone),
  ).current;
}
export async function getCheckIn(userId: string, date: string) {
  localDateSchema.parse(date);
  return readSnapshot(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user)
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    const record = await DailyCheckIn.findOne({
      userId,
      localDate: date,
    }).session(session);
    if (!record)
      throw new AppError(
        404,
        'NOT_FOUND',
        'No check-in has been recorded for this day.',
      );
    const habits = await Habit.find({ userId }).session(session);
    const dto = toCheckInDto(
      record,
      await loadCurrentStreak(userId, user.timezone, session),
    );
    dto.habitCompletions = rowsForDate(
      habits.map(toHabitDto),
      date,
      user.timezone,
      dto.habitCompletions,
    );
    return dto;
  });
}
export async function listCheckIns(
  userId: string,
  range: DateRange,
  summary: boolean,
) {
  dateRangeSchema.parse(range);
  return readSnapshot(async (session) => {
    const records = await DailyCheckIn.find({
      userId,
      localDate: { $gte: range.from, $lte: range.to },
    })
      .select(summary ? `${completionProjection} pointAwards.points` : '')
      .sort({ localDate: 1 })
      .session(session);
    if (summary)
      return records.map((r) =>
        checkInSummarySchema.parse({
          localDate: r.localDate,
          completion: completionOf(r),
          pointsEarned: r.pointAwards.reduce((n, a) => n + a.points, 0),
        }),
      );
    const user = await User.findById(userId).session(session);
    if (!user)
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    const streak = await loadCurrentStreak(userId, user.timezone, session);
    return records.map((record) => toCheckInDto(record, streak));
  });
}
export async function writeCheckIn(
  userId: string,
  date: string | undefined,
  payload: unknown,
) {
  const input = date
    ? checkInPatchSchema.parse(payload)
    : createCheckInInputSchema.parse(payload);
  const localDate = localDateSchema.parse(
    date ?? ('localDate' in input ? input.localDate : undefined),
  );
  return withUserTransaction(userId, async (user, session) => {
    validateWritableDate(localDate, user.timezone);
    const previous = await DailyCheckIn.findOne({ userId, localDate }).session(
      session,
    );
    if (date && !previous)
      throw new AppError(
        404,
        'NOT_FOUND',
        'No check-in has been recorded for this day.',
      );
    if (!date && previous)
      throw new AppError(409, 'CONFLICT', 'This date already has a check-in.');
    const record = previous ?? new DailyCheckIn({ userId, localDate });
    const habits = await Habit.find({ userId }).session(session);
    const existing = previous
      ? toCheckInDto(previous).habitCompletions
      : undefined;
    const rows = rowsForDate(
      habits.map(toHabitDto),
      localDate,
      user.timezone,
      existing,
    );
    if (input.habitCompletions) {
      for (const row of input.habitCompletions)
        if (
          !rows.some((h) => h.habitId === row.habitId) ||
          !habits.some((h) => String(h._id) === row.habitId)
        )
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'One of these habits is not available for this day.',
          );
      for (const row of rows)
        row.completed =
          input.habitCompletions.find((h) => h.habitId === row.habitId)
            ?.completed ?? false;
    }
    const { habitCompletions: ignored, ...fields } = input;
    void ignored;
    record.set(fields);
    record.set('habitCompletions', rows);
    await record.save({ session });
    return toCheckInDto(
      record,
      await loadCurrentStreak(userId, user.timezone, session),
    );
  });
}
export async function deleteCheckIn(userId: string, date: string) {
  localDateSchema.parse(date);
  return withUserTransaction(userId, async (user, session) => {
    validateWritableDate(date, user.timezone);
    const deleted = await DailyCheckIn.deleteOne({
      userId,
      localDate: date,
    }).session(session);
    if (!deleted.deletedCount)
      throw new AppError(
        404,
        'NOT_FOUND',
        'No check-in has been recorded for this day.',
      );
  });
}
