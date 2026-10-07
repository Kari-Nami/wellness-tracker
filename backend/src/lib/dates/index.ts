import { localDateSchema } from '../../types/contracts';
import { AppError } from '../http';
export function todayInZone(timezone: string, now = new Date()) {
  void timezone;
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function shiftDate(date: string, offset: number) {
  const time = new Date(`${date}T12:00:00.000Z`);
  time.setUTCDate(time.getUTCDate() + offset);
  return time.toISOString().slice(0, 10);
}
export function dateRangeKeys(from: string, to: string) {
  const days: string[] = [];
  for (
    let date = from;
    date <= to && days.length < 366;
    date = shiftDate(date, 1)
  )
    days.push(date);
  return days;
}
export function validateWritableDate(date: string, timezone: string) {
  localDateSchema.parse(date);
  if (date > todayInZone(timezone))
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Future dates cannot be logged.',
    );
}
