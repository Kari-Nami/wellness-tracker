import type { CheckInDto, DateRange, Goals } from './contracts';
export interface InsightSource {
  range: DateRange;
  today: string;
  goals: Goals;
  // Full completion history for streaks; metric output is restricted to range.
  checkIns: CheckInDto[];
  // Include eligible habits for every date in range, including missing check-in dates.
  eligibleHabitsByDate: Record<string, { habitId: string; name: string }[]>;
}
export interface LeaderboardSourceRow {
  displayName: string;
  points: number;
  currentStreak: number;
  isCurrentUser: boolean;
  // Server-only stable tie break. Never include in returned DTOs.
  tieBreakKey: string;
}
