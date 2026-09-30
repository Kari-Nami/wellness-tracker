import { z } from 'zod';
import { requireUser } from '../../../lib/auth/guards';
import { handleRoute, success } from '../../../lib/http';
import { leaderboardEntrySchema } from '../../../types/contracts';
import { loadLeaderboardSource } from '../../../services/analyticsSource';
import { buildLeaderboard } from '../../../services/leaderboardService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    const rows = await loadLeaderboardSource(user);
    return success(
      z.array(leaderboardEntrySchema).parse(buildLeaderboard(rows)),
    );
  });
}
