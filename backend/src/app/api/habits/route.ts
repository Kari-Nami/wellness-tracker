import { handleRoute, readJson, success } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { listHabits, createHabit } from '@/services/habitService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    return success(await listHabits(user.id));
  });
}
export async function POST(request: Request) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    return success(await createHabit(user.id, await readJson(request)), 201);
  });
}
