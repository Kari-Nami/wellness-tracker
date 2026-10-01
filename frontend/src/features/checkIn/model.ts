import type { CheckInDto, CheckInPatch } from '../../types/contracts';
export const moodOptions = [
  { value: 1, label: 'Very bad' },
  { value: 2, label: 'Bad' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
] as const;
export function emptyCheckIn(): Required<CheckInPatch> {
  return {
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
  };
}
export function draftFromRecord(record: CheckInDto): Required<CheckInPatch> {
  return {
    sleep: record.sleep,
    waterMl: record.waterMl,
    mood: record.mood,
    meals: record.meals,
    alcoholStatus: record.alcoholStatus,
    bowelStatus: record.bowelStatus,
    habitCompletions: record.habitCompletions.map(({ habitId, completed }) => ({
      habitId,
      completed,
    })),
  };
}
export function recordedFields(record: Required<CheckInPatch>) {
  return [
    record.sleep.durationMinutes !== null,
    record.sleep.quality !== null,
    record.waterMl !== null,
    record.mood !== null,
    record.meals.breakfast.status !== 'not_logged',
    record.meals.lunch.status !== 'not_logged',
    record.meals.dinner.status !== 'not_logged',
    record.alcoholStatus !== null,
    record.bowelStatus !== null,
  ].filter(Boolean).length;
}
