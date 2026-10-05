import { expect, it } from 'vitest';
import { buildLeaderboard } from './leaderboardService';
it('sorts ties deterministically without exposing identifiers or mutating the input', () => {
  const rows = [
    {
      displayName: 'Same',
      points: 0,
      currentStreak: 0,
      isCurrentUser: true,
      tieBreakKey: 'b',
    },
    {
      displayName: 'Same',
      points: 0,
      currentStreak: 0,
      isCurrentUser: false,
      tieBreakKey: 'a',
    },
  ];
  expect(buildLeaderboard(rows).map((r) => r.isCurrentUser)).toEqual([
    false,
    true,
  ]);
  expect(rows[0].tieBreakKey).toBe('b');
  expect(buildLeaderboard(rows)[0]).not.toHaveProperty('tieBreakKey');
});
