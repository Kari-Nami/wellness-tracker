import { handleRoute, readJson, success, noContent } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import {
  getCheckIn,
  writeCheckIn,
  deleteCheckIn,
} from '@/services/checkInService';
type Context = { params: Promise<{ localDate: string }> };
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: Context) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    return success(await getCheckIn(user.id, (await context.params).localDate));
  });
}
export async function PATCH(request: Request, context: Context) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    return success(
      await writeCheckIn(
        user.id,
        (await context.params).localDate,
        await readJson(request),
      ),
    );
  });
}
export async function DELETE(request: Request, context: Context) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    await deleteCheckIn(user.id, (await context.params).localDate);
    return noContent();
  });
}
