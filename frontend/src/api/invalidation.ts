import type { QueryClient } from '@tanstack/react-query';
export function invalidateWellness(client: QueryClient) {
  return Promise.all(
    ['checkIn', 'checkIns', 'insights', 'leaderboard'].map((key) =>
      client.invalidateQueries({ queryKey: [key] }),
    ),
  );
}
