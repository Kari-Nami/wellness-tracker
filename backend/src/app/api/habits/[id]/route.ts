import { handleRoute, readJson, success, noContent } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { getHabit, updateHabit, deleteHabit } from '@/services/habitService';
type Context = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: Context) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    return success(await getHabit(user.id, (await context.params).id));
  });
}
export async function PATCH(request: Request, context: Context) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    return success(
      await updateHabit(
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
    const user = await requireUser(request);
    await deleteHabit(user.id, (await context.params).id);
    return noContent();
  });
}
