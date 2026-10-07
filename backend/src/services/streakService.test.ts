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

it('counts explicit alcohol-free days independently of completion, breaks on missing or other statuses, and ignores future days', async () => {
  const { alcoholFreeStreakHistory } = await import('./streakService');
  const records = [
    { localDate: '2026-10-01', alcoholStatus: 'none' },
    { localDate: '2026-10-02', alcoholStatus: 'none' },
    { localDate: '2026-10-03', alcoholStatus: 'light' },
    { localDate: '2026-10-04', alcoholStatus: 'none' },
    { localDate: '2026-10-06', alcoholStatus: 'none' },
    { localDate: '2026-10-07', alcoholStatus: null },
    { localDate: '2026-10-08', alcoholStatus: 'none' },
    { localDate: '2026-10-09', alcoholStatus: 'none' },
  ];
  const result = alcoholFreeStreakHistory(records, '2026-10-08');
  expect(result.runs.get('2026-10-02')).toBe(2);
  expect(result.runs.get('2026-10-04')).toBe(1);
  expect(result.runs.get('2026-10-06')).toBe(1);
  expect(result.runs.get('2026-10-08')).toBe(1);
  expect(result.runs.has('2026-10-09')).toBe(false);
});
