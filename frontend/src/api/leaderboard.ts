import { z } from 'zod';
import { leaderboardEntrySchema } from '../types/contracts';
import { request } from './client';
export const leaderboardApi = {
  list: (signal?: AbortSignal) =>
    request('/leaderboard', z.array(leaderboardEntrySchema), { signal }),
};
