import type { DateRange, UserDto } from '../types/contracts';
import type { InsightSource, LeaderboardSourceRow } from '../types/analytics';
import { notImplemented } from '../lib/http';
// Core backend developer implements DB reads and eligibility; analytics developer consumes these ports.
export async function loadInsightSource(
  user: UserDto,
  range: DateRange,
): Promise<InsightSource> {
  void user;
  void range;
  return notImplemented();
}
export async function loadLeaderboardSource(
  user: UserDto,
): Promise<LeaderboardSourceRow[]> {
  void user;
  return notImplemented();
}
