import { requireUser } from '../../../lib/auth/guards';
import { handleRoute, success } from '../../../lib/http';
import { dateRangeSchema, insightsDtoSchema } from '../../../types/contracts';
import { loadInsightSource } from '../../../services/analyticsSource';
import { computeInsights } from '../../../services/insightService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    const params = new URL(request.url).searchParams;
    const range = dateRangeSchema.parse({
      from: params.get('from'),
      to: params.get('to'),
    });
    const source = await loadInsightSource(user, range);
    return success(insightsDtoSchema.parse(computeInsights(source)));
  });
}
