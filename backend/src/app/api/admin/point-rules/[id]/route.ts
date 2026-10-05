import { requireAdmin } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { handleRoute, success, readJson, noContent } from '@/lib/http';
import { updatePointRule, deletePointRule } from '@/services/pointRuleService';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireAdmin(request);
    return success(
      await updatePointRule(
        user.id,
        (await context.params).id,
        await readJson(request),
      ),
    );
  });
}
export async function DELETE(request: Request, context: Context) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireAdmin(request);
    await deletePointRule(user.id, (await context.params).id);
    return noContent();
  });
}
