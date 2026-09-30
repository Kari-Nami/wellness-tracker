import { format, addDays, parseISO } from 'date-fns';
export function todayInZone(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const dateFromKey = (value: string) => parseISO(value + 'T12:00:00');
export const shiftDate = (key: string, days: number) =>
  dateKey(addDays(dateFromKey(key), days));
export function dateRangeKeys(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to && days.length < 366; day = shiftDate(day, 1))
    days.push(day);
  return days;
}
export const formatDay = (key: string, pattern = 'EEEE, MMMM d') =>
  format(dateFromKey(key), pattern);
export const detectedTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
