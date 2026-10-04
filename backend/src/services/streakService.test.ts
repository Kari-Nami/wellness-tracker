import { expect, it } from 'vitest';
import { streakHistory } from './streakService';
import { completionOf, completedFieldCount } from './completion';
it('counts explicit zeros and skipped meals without requiring snacks or habits', () => {
  const data = {
    sleep: { durationMinutes: 0, quality: 'poor' },
    waterMl: 0,
    mood: 1,
    meals: {
      breakfast: { status: 'skipped' },
      lunch: { status: 'eaten' },
      dinner: { status: 'skipped' },
    },
    alcoholStatus: 'none',
    bowelStatus: 'none',
  };
  expect(completionOf(data)).toBe('complete');
  expect(completedFieldCount({ ...data, waterMl: null })).toBe(8);
});
it('handles yesterday grace, gaps, duplicate dates, and ignores future dates', () => {
  const records = [
    '2026-10-01',
    '2026-10-02',
    '2026-10-02',
    '2026-10-04',
    '2026-10-06',
  ].map((localDate) => ({ localDate, completion: 'complete' }));
  expect(streakHistory(records, '2026-10-03')).toMatchObject({
    current: 2,
    longest: 2,
  });
  expect(streakHistory(records, '2026-10-06')).toMatchObject({
    current: 1,
    longest: 2,
  });
  expect(streakHistory(records, '2026-10-08')).toMatchObject({
    current: 0,
    longest: 2,
  });
});
