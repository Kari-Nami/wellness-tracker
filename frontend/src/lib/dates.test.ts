import { describe, expect, it } from 'vitest';
import { todayInZone, shiftDate, dateRangeKeys } from './dates';
describe('local date boundaries', () => {
  it('uses profile timezones rather than the browser day', () => {
    const now = new Date('2026-10-07T20:00:00.000Z');
    expect(todayInZone('Asia/Bangkok', now)).toBe('2026-10-08');
    expect(todayInZone('America/New_York', now)).toBe('2026-10-07');
  });
  it('steps across leap days and year boundaries without UTC shifts', () => {
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(dateRangeKeys('2026-10-07', '2026-10-08')).toEqual([
      '2026-10-07',
      '2026-10-08',
    ]);
  });
});
