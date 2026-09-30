import type { LeaderboardEntry } from '../types/contracts';
import type { LeaderboardSourceRow } from '../types/analytics';
import { notImplemented } from '../lib/http';
export function buildLeaderboard(
  rows: LeaderboardSourceRow[],
): LeaderboardEntry[] {
  void rows;
  return notImplemented();
}
