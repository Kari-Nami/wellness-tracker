import { handleRoute, success } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => success(await requireUser(request)));
}
