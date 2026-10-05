import { requireAdmin } from '@/lib/auth/guards';
import { handleRoute, success } from '@/lib/http';
import { pointTriggers } from '@/services/triggerRegistry';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireAdmin(request);
    return success(pointTriggers());
  });
}
