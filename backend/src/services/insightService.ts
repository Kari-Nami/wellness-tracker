import { insightsDtoSchema, type InsightsDto } from '../types/contracts';
import type { InsightSource } from '../types/analytics';
import { dateRangeKeys } from '../lib/dates';
import { streakHistory } from './streakService';
const rate = (n: number, d: number) => (d ? (n / d) * 100 : null);
const average = (values: (number | null)[]) => {
  const logged = values.filter((v): v is number => v !== null);
  return logged.length
    ? logged.reduce((n, v) => n + v, 0) / logged.length
    : null;
};
export function computeInsights(source: InsightSource): InsightsDto {
  const records = new Map(source.checkIns.map((c) => [c.localDate, c]));
  const alcoholDistribution: InsightsDto['alcoholDistribution'] = {
    none: 0,
    light: 0,
    heavy: 0,
    blackout: 0,
    notLogged: 0,
  };
  const bowelDistribution: InsightsDto['bowelDistribution'] = {
    none: 0,
    uncomfortable: 0,
    normal: 0,
    good: 0,
    notLogged: 0,
  };
  const habitCounts = new Map<
    string,
    {
      habitId: string;
      name: string;
      completedDays: number;
      eligibleDays: number;
    }
  >();
  const days = dateRangeKeys(source.range.from, source.range.to).map(
    (localDate) => {
      const c = records.get(localDate);
      const eligible = source.eligibleHabitsByDate[localDate] ?? [];
      let habitsCompleted = 0;
      for (const h of eligible) {
        const counts = habitCounts.get(h.habitId) ?? {
          ...h,
          completedDays: 0,
          eligibleDays: 0,
        };
        counts.name = h.name;
        counts.eligibleDays++;
        if (
          c?.habitCompletions.some(
            (row) => row.habitId === h.habitId && row.completed,
          )
        ) {
          counts.completedDays++;
          habitsCompleted++;
        }
        habitCounts.set(h.habitId, counts);
      }
      alcoholDistribution[c?.alcoholStatus ?? 'notLogged']++;
      bowelDistribution[c?.bowelStatus ?? 'notLogged']++;
      const meals = c ? [c.meals.breakfast, c.meals.lunch, c.meals.dinner] : [];
      return {
        localDate,
        completion: c?.completion ?? 'missing',
        sleepMinutes: c?.sleep.durationMinutes ?? null,
        waterMl: c?.waterMl ?? null,
        mood: c?.mood ?? null,
        mealsEaten: meals.filter((m) => m.status === 'eaten').length,
        mealsLogged: meals.filter((m) => m.status !== 'not_logged').length,
        habitsCompleted,
        habitsEligible: eligible.length,
        pointsEarned: c?.pointsEarned ?? 0,
      };
    },
  );
  const streak = streakHistory(source.checkIns, source.today);
  const completeDayCount = days.filter(
    (d) => d.completion === 'complete',
  ).length;
  const loggedSleep = days.filter((d) => d.sleepMinutes !== null);
  const loggedWater = days.filter((d) => d.waterMl !== null);
  return insightsDtoSchema.parse({
    ...source.range,
    dayCount: days.length,
    recordedDayCount: days.filter((d) => d.completion !== 'missing').length,
    completeDayCount,
    summary: {
      averageSleepMinutes: average(days.map((d) => d.sleepMinutes)),
      sleepGoalRate: rate(
        loggedSleep.filter(
          (d) => d.sleepMinutes! >= source.goals.sleepHours * 60,
        ).length,
        loggedSleep.length,
      ),
      averageWaterMl: average(days.map((d) => d.waterMl)),
      waterGoalRate: rate(
        loggedWater.filter((d) => d.waterMl! >= source.goals.waterMl).length,
        loggedWater.length,
      ),
      averageMood: average(days.map((d) => d.mood)),
      checkInCompletionRate: rate(completeDayCount, days.length),
      habitCompletionRate: rate(
        days.reduce((n, d) => n + d.habitsCompleted, 0),
        days.reduce((n, d) => n + d.habitsEligible, 0),
      ),
      mealLoggingRate: rate(
        days.reduce((n, d) => n + d.mealsLogged, 0),
        3 * days.length,
      ),
      totalPoints: days.reduce((n, d) => n + d.pointsEarned, 0),
      currentStreak: streak.current,
      longestStreak: streak.longest,
    },
    days,
    alcoholDistribution,
    bowelDistribution,
    habits: [...habitCounts.values()].map((h) => ({
      ...h,
      completionRate: rate(h.completedDays, h.eligibleDays),
    })),
  });
}
