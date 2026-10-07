// These calculations support the isolated demo transport. Production values come from the API.
import type {
  CheckInDto,
  CheckInPatch,
  HabitDto,
  UserDto,
  InsightsDto,
  DateRange,
  TriggerKey,
} from '../types/contracts';
import { recordedFields } from '../features/checkIn/model';
import { dateRangeKeys, shiftDate, todayInZone } from '../lib/dates';
import type { DemoDatabase } from './data';
export function runEnding(records: Record<string, CheckInDto>, date: string) {
  let count = 0;
  for (
    let day = date;
    records[day]?.completion === 'complete';
    day = shiftDate(day, -1)
  )
    count++;
  return count;
}
export function currentStreak(
  records: Record<string, CheckInDto>,
  today: string,
) {
  return runEnding(
    records,
    records[today]?.completion === 'complete' ? today : shiftDate(today, -1),
  );
}
export function relevantHabits(
  habits: HabitDto[],
  date: string,
  timezone: string,
) {
  return habits.filter(
    (h) =>
      todayInZone(timezone, new Date(h.createdAt)) <= date &&
      (!h.deletedAt
        ? h.active
        : todayInZone(timezone, new Date(h.deletedAt)) >= date),
  );
}
export function reconcile(
  db: DemoDatabase,
  user: UserDto,
  editedDate?: string,
) {
  const records = db.records[user.id] ?? {};
  const habits = db.habits[user.id] ?? [];
  const today = todayInZone(user.timezone);
  for (const record of Object.values(records)) {
    const count = recordedFields(record as Required<CheckInPatch>);
    record.completedFieldCount = count;
    record.completion = count === 9 ? 'complete' : 'partial';
  }
  for (const record of Object.values(records)) {
    const keys = new Map<string, TriggerKey>();
    if (record.completion === 'complete')
      keys.set('DAILY_CHECKIN_COMPLETE', 'DAILY_CHECKIN_COMPLETE');
    if (
      user.goals.waterMl !== null &&
      record.waterMl !== null &&
      record.waterMl >= user.goals.waterMl
    )
      keys.set('WATER_GOAL_REACHED', 'WATER_GOAL_REACHED');
    if (
      user.goals.sleepHours !== null &&
      record.sleep.durationMinutes !== null &&
      record.sleep.durationMinutes >= user.goals.sleepHours! * 60
    )
      keys.set('SLEEP_GOAL_REACHED', 'SLEEP_GOAL_REACHED');
    if (record.alcoholStatus !== null)
      keys.set('ALCOHOL_STATUS_LOGGED', 'ALCOHOL_STATUS_LOGGED');
    const eligible = new Set(
      relevantHabits(habits, record.localDate, user.timezone).map((h) => h.id),
    );
    const completions = record.habitCompletions.filter((h) =>
      eligible.has(h.habitId),
    );
    for (const habit of completions.filter((h) => h.completed))
      keys.set(`HABIT_COMPLETE:${habit.habitId}`, 'HABIT_COMPLETE');
    if (
      eligible.size > 0 &&
      completions.filter((h) => h.completed).length === eligible.size
    )
      keys.set('ALL_DAILY_HABITS_COMPLETE', 'ALL_DAILY_HABITS_COMPLETE');
    const run = runEnding(records, record.localDate);
    if (run === 7) keys.set('CHECKIN_STREAK_7', 'CHECKIN_STREAK_7');
    if (run === 30) keys.set('CHECKIN_STREAK_30', 'CHECKIN_STREAK_30');
    const isStreak = (key: string) => key.startsWith('CHECKIN_STREAK_');
    const applies = (key: string) =>
      !editedDate || record.localDate === editedDate || isStreak(key);
    record.pointAwards = record.pointAwards.filter(
      (award) => !applies(award.instanceKey) || keys.has(award.instanceKey),
    );
    for (const [instanceKey, triggerKey] of keys) {
      if (
        !applies(instanceKey) ||
        record.pointAwards.some((a) => a.instanceKey === instanceKey)
      )
        continue;
      const rule = db.rules.find(
        (r) => r.triggerKey === triggerKey && r.enabled,
      );
      if (rule)
        record.pointAwards.push({
          triggerKey,
          instanceKey,
          points: rule.points,
          awardedAt: new Date().toISOString(),
        });
    }
    record.pointsEarned = record.pointAwards.reduce(
      (total, a) => total + a.points,
      0,
    );
    record.currentStreak = currentStreak(records, today);
  }
}
const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const rate = (numerator: number, denominator: number) =>
  denominator ? (numerator / denominator) * 100 : null;
export function demoInsights(
  db: DemoDatabase,
  user: UserDto,
  range: DateRange,
): InsightsDto {
  const records = db.records[user.id] ?? {};
  const habits = db.habits[user.id] ?? [];
  const keys = dateRangeKeys(range.from, range.to);
  const days = keys.map((localDate) => {
    const r: CheckInDto | undefined = Object.hasOwn(records, localDate)
      ? records[localDate]
      : undefined;
    const eligible = relevantHabits(habits, localDate, user.timezone);
    const meals = r ? [r.meals.breakfast, r.meals.lunch, r.meals.dinner] : [];
    return {
      localDate,
      completion: r?.completion ?? ('missing' as const),
      sleepMinutes: r?.sleep.durationMinutes ?? null,
      waterMl: r?.waterMl ?? null,
      mood: r?.mood ?? null,
      mealsEaten:
        meals.filter((m) => m.status === 'eaten').length +
        (r?.meals.snacks.length ?? 0),
      mealsLogged: meals.filter((m) => m.status !== 'not_logged').length,
      habitsCompleted:
        r?.habitCompletions.filter(
          (h) => h.completed && eligible.some((e) => e.id === h.habitId),
        ).length ?? 0,
      habitsEligible: eligible.length,
      pointsEarned: r?.pointsEarned ?? 0,
    };
  });
  const sleep = days.flatMap((d) =>
    d.sleepMinutes === null ? [] : [d.sleepMinutes],
  );
  const water = days.flatMap((d) => (d.waterMl === null ? [] : [d.waterMl]));
  const mood = days.flatMap((d) => (d.mood === null ? [] : [d.mood]));
  const complete = days.filter((d) => d.completion === 'complete').length;
  const alcohol = { none: 0, light: 0, heavy: 0, blackout: 0, notLogged: 0 };
  const bowel = { none: 0, uncomfortable: 0, normal: 0, good: 0, notLogged: 0 };
  for (const key of keys) {
    alcohol[records[key]?.alcoholStatus ?? 'notLogged']++;
    bowel[records[key]?.bowelStatus ?? 'notLogged']++;
  }
  return {
    ...range,
    dayCount: days.length,
    recordedDayCount: days.filter((d) => d.completion !== 'missing').length,
    completeDayCount: complete,
    summary: {
      averageSleepMinutes: average(sleep),
      sleepGoalRate:
        user.goals.sleepHours === null
          ? null
          : rate(
              sleep.filter((v) => v >= user.goals.sleepHours! * 60).length,
              sleep.length,
            ),
      averageWaterMl: average(water),
      waterGoalRate:
        user.goals.waterMl === null
          ? null
          : rate(
              water.filter((v) => v >= user.goals.waterMl!).length,
              water.length,
            ),
      averageMood: average(mood),
      checkInCompletionRate: rate(complete, days.length),
      habitCompletionRate: rate(
        days.reduce((n, d) => n + d.habitsCompleted, 0),
        days.reduce((n, d) => n + d.habitsEligible, 0),
      ),
      mealLoggingRate: rate(
        days.reduce((n, d) => n + d.mealsLogged, 0),
        days.length * 3,
      ),
      totalPoints: days.reduce((n, d) => n + d.pointsEarned, 0),
      currentStreak: currentStreak(records, todayInZone(user.timezone)),
      longestStreak: Math.max(
        0,
        ...Object.keys(records).map((key) => runEnding(records, key)),
      ),
    },
    days,
    alcoholDistribution: alcohol,
    bowelDistribution: bowel,
    habits: habits
      .map((h) => {
        const eligible = keys.filter((key) =>
          relevantHabits(habits, key, user.timezone).some((e) => e.id === h.id),
        );
        const completedDays = eligible.filter((key) =>
          records[key]?.habitCompletions.some(
            (c) => c.habitId === h.id && c.completed,
          ),
        ).length;
        return {
          habitId: h.id,
          name: h.name,
          completedDays,
          eligibleDays: eligible.length,
          completionRate: rate(completedDays, eligible.length),
        };
      })
      .filter((h) => h.eligibleDays > 0),
  };
}
