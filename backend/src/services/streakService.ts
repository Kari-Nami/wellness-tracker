import { shiftDate } from '../lib/dates';
export function streakHistory(
  records: readonly { localDate: string; completion: string }[],
  today: string,
) {
  const dates = [
    ...new Set(
      records
        .filter((r) => r.completion === 'complete' && r.localDate <= today)
        .map((r) => r.localDate),
    ),
  ].sort();
  const runs = new Map<string, number>();
  let previous = '';
  let length = 0;
  let longest = 0;
  for (const date of dates) {
    length = previous && shiftDate(previous, 1) === date ? length + 1 : 1;
    runs.set(date, length);
    longest = Math.max(longest, length);
    previous = date;
  }
  return {
    runs,
    longest,
    current: runs.get(today) ?? runs.get(shiftDate(today, -1)) ?? 0,
  };
}
