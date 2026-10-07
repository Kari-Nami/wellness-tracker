import { shiftDate } from '../lib/dates';
export function streakHistory(
  records: readonly { localDate: string; completion: string }[],
  today: string,
) {
  return consecutiveDateRuns(
    records.filter((r) => r.completion === 'complete').map((r) => r.localDate),
    today,
  );
}
export function alcoholFreeStreakHistory(
  records: readonly { localDate: string; alcoholStatus: string | null }[],
  today: string,
) {
  return consecutiveDateRuns(
    records.filter((r) => r.alcoholStatus === 'none').map((r) => r.localDate),
    today,
  );
}
function consecutiveDateRuns(input: readonly string[], today: string) {
  const dates = [...new Set(input.filter((date) => date <= today))].sort();
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
