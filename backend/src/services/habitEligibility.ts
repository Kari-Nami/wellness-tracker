import type { HabitDto, CheckInDto } from '../types/contracts';
import { todayInZone } from '../lib/dates';
export function habitsForDate(
  habits: HabitDto[],
  date: string,
  timezone: string,
) {
  const today = todayInZone(timezone);
  return habits.filter(
    (h) =>
      todayInZone(timezone, new Date(h.createdAt)) <= date &&
      (date === today
        ? h.active && !h.deletedAt
        : h.deletedAt
          ? todayInZone(timezone, new Date(h.deletedAt)) >= date
          : h.active),
  );
}
export function rowsForDate(
  habits: HabitDto[],
  date: string,
  timezone: string,
  existing?: CheckInDto['habitCompletions'],
) {
  if (existing && date < todayInZone(timezone))
    return existing.map((row) => ({ ...row }));
  const eligible = habitsForDate(habits, date, timezone);
  const rows = (existing ?? [])
    .filter((row) => eligible.some((h) => h.id === row.habitId))
    .map((row) => ({ ...row }));
  for (const habit of eligible) {
    const present = rows.find((row) => row.habitId === habit.id);
    if (present) present.habitNameSnapshot = habit.name;
    else
      rows.push({
        habitId: habit.id,
        habitNameSnapshot: habit.name,
        completed: false,
      });
  }
  return rows;
}
