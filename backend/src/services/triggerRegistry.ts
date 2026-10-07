import {
  POINT_TRIGGER_DEFINITIONS,
  type CheckInDto,
  type Goals,
  type TriggerKey,
  type PointTriggerDto,
} from '../types/contracts';
export interface TriggerContext {
  checkIn: CheckInDto;
  goals: Goals;
  runLength: number;
  alcoholFreeRunLength: number;
  eligibleHabitIds: Set<string>;
}
interface Trigger extends PointTriggerDto {
  defaultPoints: number;
  instances: (context: TriggerContext) => string[];
}
const singleton =
  (key: TriggerKey, test: (c: TriggerContext) => boolean) =>
  (c: TriggerContext) => (test(c) ? [key] : []);
const mainMeals = ['breakfast', 'lunch', 'dinner'] as const;
const instances: Record<TriggerKey, Trigger['instances']> = {
  DAILY_CHECKIN_COMPLETE: singleton(
    'DAILY_CHECKIN_COMPLETE',
    (c) => c.checkIn.completion === 'complete',
  ),
  HABIT_COMPLETE: (c) =>
    c.checkIn.habitCompletions
      .filter((h) => h.completed && c.eligibleHabitIds.has(h.habitId))
      .map((h) => 'HABIT_COMPLETE:' + h.habitId),
  ALL_DAILY_HABITS_COMPLETE: singleton(
    'ALL_DAILY_HABITS_COMPLETE',
    (c) =>
      c.eligibleHabitIds.size > 0 &&
      [...c.eligibleHabitIds].every((id) =>
        c.checkIn.habitCompletions.some((h) => h.habitId === id && h.completed),
      ),
  ),
  WATER_GOAL_REACHED: singleton(
    'WATER_GOAL_REACHED',
    (c) =>
      c.goals.waterMl !== null &&
      c.checkIn.waterMl !== null &&
      c.checkIn.waterMl >= c.goals.waterMl,
  ),
  SLEEP_GOAL_REACHED: singleton(
    'SLEEP_GOAL_REACHED',
    (c) =>
      c.goals.sleepHours !== null &&
      c.checkIn.sleep.durationMinutes !== null &&
      c.checkIn.sleep.durationMinutes >= c.goals.sleepHours * 60,
  ),
  ALCOHOL_STATUS_LOGGED: singleton(
    'ALCOHOL_STATUS_LOGGED',
    (c) => c.checkIn.alcoholStatus !== null,
  ),
  CHECKIN_STREAK_7: singleton('CHECKIN_STREAK_7', (c) => c.runLength === 7),
  CHECKIN_STREAK_30: singleton('CHECKIN_STREAK_30', (c) => c.runLength === 30),
  WATER_LOGGED: singleton('WATER_LOGGED', (c) => c.checkIn.waterMl !== null),
  SLEEP_LOGGED: singleton(
    'SLEEP_LOGGED',
    (c) => c.checkIn.sleep.durationMinutes !== null,
  ),
  MOOD_LOGGED: singleton('MOOD_LOGGED', (c) => c.checkIn.mood !== null),
  BOWEL_STATUS_LOGGED: singleton(
    'BOWEL_STATUS_LOGGED',
    (c) => c.checkIn.bowelStatus !== null,
  ),
  MOOD_GOAL_REACHED: singleton(
    'MOOD_GOAL_REACHED',
    (c) =>
      c.goals.targetMood !== null &&
      c.checkIn.mood !== null &&
      c.checkIn.mood >= c.goals.targetMood,
  ),
  BOWEL_GOAL_REACHED: singleton(
    'BOWEL_GOAL_REACHED',
    (c) =>
      c.goals.targetBowelStatus !== null &&
      c.checkIn.bowelStatus === c.goals.targetBowelStatus,
  ),
  MEAL_LOGGED: (c) =>
    mainMeals
      .filter((key) => c.checkIn.meals[key].status !== 'not_logged')
      .map((key) => 'MEAL_LOGGED:' + key),
  MEAL_GOAL_REACHED: singleton('MEAL_GOAL_REACHED', (c) => {
    const eaten =
      mainMeals.filter((key) => c.checkIn.meals[key].status === 'eaten')
        .length + c.checkIn.meals.snacks.length;
    return (
      c.goals.mealsPerDay !== null && eaten > 0 && eaten >= c.goals.mealsPerDay
    );
  }),
  ALL_MAIN_MEALS_EATEN: singleton('ALL_MAIN_MEALS_EATEN', (c) =>
    mainMeals.every((key) => c.checkIn.meals[key].status === 'eaten'),
  ),
  ALCOHOL_FREE_STREAK_7: singleton(
    'ALCOHOL_FREE_STREAK_7',
    (c) => c.alcoholFreeRunLength === 7,
  ),
  ALCOHOL_FREE_STREAK_10: singleton(
    'ALCOHOL_FREE_STREAK_10',
    (c) => c.alcoholFreeRunLength === 10,
  ),
  ALCOHOL_FREE_STREAK_30: singleton(
    'ALCOHOL_FREE_STREAK_30',
    (c) => c.alcoholFreeRunLength === 30,
  ),
};
export const triggerRegistry: Trigger[] = POINT_TRIGGER_DEFINITIONS.map(
  (definition) => ({ ...definition, instances: instances[definition.key] }),
);
export const streakKeys = new Set<TriggerKey>([
  'CHECKIN_STREAK_7',
  'CHECKIN_STREAK_30',
  'ALCOHOL_FREE_STREAK_7',
  'ALCOHOL_FREE_STREAK_10',
  'ALCOHOL_FREE_STREAK_30',
]);
export function pointTriggers(): PointTriggerDto[] {
  return triggerRegistry.map(({ key, label, description }) => ({
    key,
    label,
    description,
  }));
}
