import { expect, it } from 'vitest';
import { triggerRegistry, type TriggerContext } from './triggerRegistry';
import {
  DEFAULT_GOALS,
  type CheckInDto,
  type TriggerKey,
} from '../types/contracts';
const checkIn: CheckInDto = {
  id: '000000000000000000000001',
  localDate: '2026-10-08',
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
  completion: 'partial',
  completedFieldCount: 0,
  requiredFieldCount: 9,
  pointsEarned: 0,
  pointAwards: [],
  currentStreak: 0,
  createdAt: '2026-10-08T00:00:00.000Z',
  updatedAt: '2026-10-08T00:00:00.000Z',
};
function context(): TriggerContext {
  return {
    checkIn: structuredClone(checkIn),
    goals: { ...DEFAULT_GOALS },
    runLength: 0,
    alcoholFreeRunLength: 0,
    eligibleHabitIds: new Set(),
  };
}
const awards = (key: TriggerKey, value: TriggerContext) =>
  triggerRegistry.find((t) => t.key === key)!.instances(value);
it.each([
  ['WATER_LOGGED', { waterMl: 0 }],
  ['SLEEP_LOGGED', { sleep: { durationMinutes: 0, quality: null } }],
  ['MOOD_LOGGED', { mood: 1 }],
  ['BOWEL_STATUS_LOGGED', { bowelStatus: 'none' }],
] as const)(
  'rewards %s for an explicit entry and allows clearing it',
  (key, value) => {
    const c = context();
    expect(awards(key, c)).toEqual([]);
    Object.assign(c.checkIn, value);
    expect(awards(key, c)).toEqual([key]);
    expect(awards(key, context())).toEqual([]);
  },
);
it('requires a selected mood target and a reading at or above it', () => {
  const c = context();
  c.checkIn.mood = 5;
  expect(awards('MOOD_GOAL_REACHED', c)).toEqual([]);
  c.goals.targetMood = 4;
  c.checkIn.mood = 3;
  expect(awards('MOOD_GOAL_REACHED', c)).toEqual([]);
  for (const mood of [4, 5] as const) {
    c.checkIn.mood = mood;
    expect(awards('MOOD_GOAL_REACHED', c)).toHaveLength(1);
  }
  c.checkIn.mood = null;
  expect(awards('MOOD_GOAL_REACHED', c)).toEqual([]);
});
it('matches bowel targets exactly, including explicit none, without assigning an order to the statuses', () => {
  const c = context();
  c.checkIn.bowelStatus = 'normal';
  expect(awards('BOWEL_GOAL_REACHED', c)).toEqual([]);
  c.goals.targetBowelStatus = 'normal';
  expect(awards('BOWEL_GOAL_REACHED', c)).toHaveLength(1);
  c.checkIn.bowelStatus = 'good';
  expect(awards('BOWEL_GOAL_REACHED', c)).toEqual([]);
  c.checkIn.bowelStatus = c.goals.targetBowelStatus = 'none';
  expect(awards('BOWEL_GOAL_REACHED', c)).toHaveLength(1);
  c.checkIn.bowelStatus = null;
  expect(awards('BOWEL_GOAL_REACHED', c)).toEqual([]);
});
it('uses one logging award per main meal, counts eaten meals and snacks toward the target, and requires every main meal eaten for the bonus', () => {
  const c = context();
  c.checkIn.meals = {
    breakfast: { status: 'eaten' },
    lunch: { status: 'skipped' },
    dinner: { status: 'eaten' },
    snacks: [{ description: 'Apple' }],
  };
  expect(awards('MEAL_LOGGED', c)).toEqual([
    'MEAL_LOGGED:breakfast',
    'MEAL_LOGGED:lunch',
    'MEAL_LOGGED:dinner',
  ]);
  expect(awards('MEAL_GOAL_REACHED', c)).toEqual([]);
  c.goals.mealsPerDay = 3;
  expect(awards('MEAL_GOAL_REACHED', c)).toHaveLength(1);
  expect(awards('ALL_MAIN_MEALS_EATEN', c)).toEqual([]);
  c.checkIn.meals.lunch = { status: 'eaten' };
  c.goals.mealsPerDay = 4;
  expect(awards('MEAL_GOAL_REACHED', c)).toHaveLength(1);
  expect(awards('ALL_MAIN_MEALS_EATEN', c)).toHaveLength(1);
  c.checkIn.meals.snacks = [];
  expect(awards('MEAL_GOAL_REACHED', c)).toEqual([]);
  const empty = context();
  empty.goals.mealsPerDay = 0;
  expect(awards('MEAL_GOAL_REACHED', empty)).toEqual([]);
});
it('awards alcohol-free milestones only on the exact milestone day', () => {
  const c = context();
  for (const day of [7, 10, 30] as const) {
    const key = `ALCOHOL_FREE_STREAK_${day}` as TriggerKey;
    for (const run of [day - 1, day, day + 1]) {
      c.alcoholFreeRunLength = run;
      expect(awards(key, c)).toHaveLength(run === day ? 1 : 0);
    }
  }
});
