import type { LeaderboardEntry } from '../types/contracts';
import type { LeaderboardSourceRow } from '../types/analytics';
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function buildLeaderboard(
  rows: LeaderboardSourceRow[],
): LeaderboardEntry[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.points - a.points ||
        compareText(a.displayName, b.displayName) ||
        compareText(a.tieBreakKey, b.tieBreakKey),
    )
    .map(({ displayName, points, currentStreak, isCurrentUser }, index) => ({
      rank: index + 1,
      displayName,
      points,
      currentStreak,
      isCurrentUser,
    }));
}
