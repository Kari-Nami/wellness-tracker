import type { ClientSession, HydratedDocument } from 'mongoose';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { Habit } from '../models/Habit';
import { PointRule } from '../models/PointRule';
import type { UserRecord } from '../models/User';
import { toCheckInDto, toHabitDto, toUserDto } from '../lib/dto';
import { todayInZone } from '../lib/dates';
import { streakHistory, alcoholFreeStreakHistory } from './streakService';
import { habitsForDate } from './habitEligibility';
import { triggerRegistry, streakKeys } from './triggerRegistry';
import type { CheckInDto } from '../types/contracts';
export async function reconcileAwards(
  user: HydratedDocument<UserRecord>,
  editedDate: string | ReadonlySet<string>,
  session: ClientSession,
  priorRecord?: CheckInDto | null,
) {
  const history = await DailyCheckIn.find({ userId: user._id })
    .sort({ localDate: 1 })
    .session(session);
  const rules = await PointRule.find({}).session(session);
  const habits = (await Habit.find({ userId: user._id }).session(session)).map(
    toHabitDto,
  );
  const dtos = history.map((r) => toCheckInDto(r));
  const today = todayInZone(user.timezone);
  const streak = streakHistory(dtos, today);
  const alcoholFree = alcoholFreeStreakHistory(dtos, today);
  const before =
    priorRecord === undefined
      ? null
      : dtos
          .filter((r) => r.localDate !== editedDate)
          .concat(priorRecord ? [priorRecord] : []);
  const priorStreak = before ? streakHistory(before, today) : null;
  const priorAlcoholFree = before
    ? alcoholFreeStreakHistory(before, today)
    : null;
  const goals = toUserDto(user).goals;
  for (let i = 0; i < history.length; i++) {
    const record = history[i];
    const dto = dtos[i];
    const direct =
      typeof editedDate === 'string'
        ? dto.localDate === editedDate
        : editedDate.has(dto.localDate);
    const eligibleHabitIds = new Set(
      dto.localDate < today
        ? dto.habitCompletions.map((h) => h.habitId)
        : habitsForDate(habits, dto.localDate, user.timezone).map((h) => h.id),
    );
    const desired = new Map<string, CheckInDto['pointAwards'][number]>();
    // Unrelated dates keep ordinary awards. Only milestone eligibility changes across history.
    for (const award of dto.pointAwards)
      if (!direct && !streakKeys.has(award.triggerKey))
        desired.set(award.instanceKey, award);
    for (const trigger of triggerRegistry) {
      if (!direct && !streakKeys.has(trigger.key)) continue;
      for (const instanceKey of trigger.instances({
        checkIn: dto,
        goals,
        runLength: streak.runs.get(dto.localDate) ?? 0,
        alcoholFreeRunLength: alcoholFree.runs.get(dto.localDate) ?? 0,
        eligibleHabitIds,
      })) {
        const previous = dto.pointAwards.find(
          (a) => a.instanceKey === instanceKey && a.triggerKey === trigger.key,
        );
        if (previous) desired.set(instanceKey, previous);
        else {
          // Add milestones on other dates only when this edit changes their consecutive run.
          const priorRuns = trigger.key.startsWith('ALCOHOL_FREE_STREAK_')
            ? priorAlcoholFree?.runs
            : priorStreak?.runs;
          const nextRuns = trigger.key.startsWith('ALCOHOL_FREE_STREAK_')
            ? alcoholFree.runs
            : streak.runs;
          if (
            !direct &&
            streakKeys.has(trigger.key) &&
            before &&
            (priorRuns?.get(dto.localDate) ?? 0) ===
              (nextRuns.get(dto.localDate) ?? 0)
          )
            continue;
          const rule = rules.find(
            (r) => r.triggerKey === trigger.key && r.enabled,
          );
          if (rule)
            desired.set(instanceKey, {
              triggerKey: trigger.key,
              instanceKey,
              points: rule.points,
              awardedAt: new Date().toISOString(),
            });
        }
      }
    }
    const next = [...desired.values()];
    if (JSON.stringify(next) !== JSON.stringify(dto.pointAwards)) {
      record.set('pointAwards', next);
      await record.save({ session });
    }
  }
  return { history, currentStreak: streak.current };
}
