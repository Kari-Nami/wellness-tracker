import { handleRoute, readJson, success } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { updateProfile } from '@/services/authService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => success(await requireUser(request)));
}
export async function PATCH(request: Request) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    return success(await updateProfile(user.id, await readJson(request)));
  });
}
