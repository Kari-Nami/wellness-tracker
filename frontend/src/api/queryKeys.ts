export const queryKeys = {
  auth: ['auth', 'me'] as const,
  profile: ['user', 'profile'] as const,
  checkIn: (date: string) => ['checkIn', date] as const,
  checkIns: (from: string, to: string, view: 'full' | 'summary' = 'full') =>
    ['checkIns', from, to, view] as const,
  habits: (includeArchived = false) => ['habits', includeArchived] as const,
  insights: (from: string, to: string) => ['insights', from, to] as const,
  leaderboard: ['leaderboard'] as const,
  pointRules: ['admin', 'pointRules'] as const,
  pointTriggers: ['admin', 'pointTriggers'] as const,
};
