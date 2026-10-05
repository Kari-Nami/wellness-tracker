import type {
  CheckInDto,
  Goals,
  TriggerKey,
  PointTriggerDto,
} from '../types/contracts';
export interface TriggerContext {
  checkIn: CheckInDto;
  goals: Goals;
  runLength: number;
  eligibleHabitIds: Set<string>;
}
interface Trigger extends PointTriggerDto {
  defaultPoints: number;
  instances: (context: TriggerContext) => string[];
}
const singleton =
  (key: TriggerKey, test: (c: TriggerContext) => boolean) =>
  (c: TriggerContext) => (test(c) ? [key] : []);
export const triggerRegistry: Trigger[] = [
  {
    key: 'DAILY_CHECKIN_COMPLETE',
    label: 'Complete daily check-in',
    description: 'Log all nine required wellness fields.',
    defaultPoints: 10,
    instances: singleton(
      'DAILY_CHECKIN_COMPLETE',
      (c) => c.checkIn.completion === 'complete',
    ),
  },
  {
    key: 'HABIT_COMPLETE',
    label: 'Complete a daily habit',
    description: 'Awarded once per completed eligible habit.',
    defaultPoints: 3,
    instances: (c) =>
      c.checkIn.habitCompletions
        .filter((h) => h.completed && c.eligibleHabitIds.has(h.habitId))
        .map((h) => 'HABIT_COMPLETE:' + h.habitId),
  },
  {
    key: 'ALL_DAILY_HABITS_COMPLETE',
    label: 'Complete all daily habits',
    description: 'Complete every eligible habit, with at least one habit.',
    defaultPoints: 5,
    instances: singleton(
      'ALL_DAILY_HABITS_COMPLETE',
      (c) =>
        c.eligibleHabitIds.size > 0 &&
        [...c.eligibleHabitIds].every((id) =>
          c.checkIn.habitCompletions.some(
            (h) => h.habitId === id && h.completed,
          ),
        ),
    ),
  },
  {
    key: 'WATER_GOAL_REACHED',
    label: 'Reach water target',
    description: 'A logged water reading reaches your current daily target.',
    defaultPoints: 3,
    instances: singleton(
      'WATER_GOAL_REACHED',
      (c) => c.checkIn.waterMl !== null && c.checkIn.waterMl >= c.goals.waterMl,
    ),
  },
  {
    key: 'SLEEP_GOAL_REACHED',
    label: 'Reach sleep target',
    description: 'A logged sleep duration reaches your current daily target.',
    defaultPoints: 3,
    instances: singleton(
      'SLEEP_GOAL_REACHED',
      (c) =>
        c.checkIn.sleep.durationMinutes !== null &&
        c.checkIn.sleep.durationMinutes >= c.goals.sleepHours * 60,
    ),
  },
  {
    key: 'ALCOHOL_STATUS_LOGGED',
    label: 'Log alcohol status',
    description: 'Explicitly record any alcohol status, including none.',
    defaultPoints: 2,
    instances: singleton(
      'ALCOHOL_STATUS_LOGGED',
      (c) => c.checkIn.alcoholStatus !== null,
    ),
  },
  {
    key: 'CHECKIN_STREAK_7',
    label: 'Seven-day check-in streak',
    description: 'Reach exactly seven consecutive complete check-ins.',
    defaultPoints: 20,
    instances: singleton('CHECKIN_STREAK_7', (c) => c.runLength === 7),
  },
  {
    key: 'CHECKIN_STREAK_30',
    label: 'Thirty-day check-in streak',
    description: 'Reach exactly thirty consecutive complete check-ins.',
    defaultPoints: 50,
    instances: singleton('CHECKIN_STREAK_30', (c) => c.runLength === 30),
  },
];
export const streakKeys = new Set<TriggerKey>([
  'CHECKIN_STREAK_7',
  'CHECKIN_STREAK_30',
]);
export function pointTriggers(): PointTriggerDto[] {
  return triggerRegistry.map(({ key, label, description }) => ({
    key,
    label,
    description,
  }));
}
