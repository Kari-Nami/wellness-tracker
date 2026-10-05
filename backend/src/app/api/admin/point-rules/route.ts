import { requireAdmin } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { handleRoute, success, readJson } from '@/lib/http';
import { listPointRules, createPointRule } from '@/services/pointRuleService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireAdmin(request);
    return success(await listPointRules());
  });
}
export async function POST(request: Request) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireAdmin(request);
    return success(
      await createPointRule(user.id, await readJson(request)),
      201,
    );
  });
}
