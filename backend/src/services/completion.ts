export interface CompletionFields {
  sleep: { durationMinutes?: number | null; quality?: string | null };
  waterMl?: number | null;
  mood?: number | null;
  meals: {
    breakfast: { status?: string };
    lunch: { status?: string };
    dinner: { status?: string };
  };
  alcoholStatus?: string | null;
  bowelStatus?: string | null;
}
export function completedFieldCount(record: CompletionFields) {
  const logged = (status?: string) =>
    status === 'eaten' || status === 'skipped';
  return [
    record.sleep.durationMinutes != null,
    record.sleep.quality != null,
    record.waterMl != null,
    record.mood != null,
    logged(record.meals.breakfast.status),
    logged(record.meals.lunch.status),
    logged(record.meals.dinner.status),
    record.alcoholStatus != null,
    record.bowelStatus != null,
  ].filter(Boolean).length;
}
export const completionOf = (record: CompletionFields) =>
  completedFieldCount(record) === 9
    ? ('complete' as const)
    : ('partial' as const);
