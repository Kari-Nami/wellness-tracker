import { handleRoute, readJson, success, AppError } from '@/lib/http';
import { requireUser } from '@/lib/auth/guards';
import { requireOrigin } from '@/lib/auth/origin';
import { rangeFromRequest } from '@/lib/validation/query';
import { listCheckIns, writeCheckIn } from '@/services/checkInService';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser(request);
    const view = new URL(request.url).searchParams.get('view');
    if (view !== null && view !== 'summary' && view !== 'full')
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Choose summary or full view.',
      );
    return success(
      await listCheckIns(
        user.id,
        rangeFromRequest(request),
        view === 'summary',
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleRoute(async () => {
    requireOrigin(request);
    const user = await requireUser(request);
    return success(
      await writeCheckIn(user.id, undefined, await readJson(request)),
      201,
    );
  });
}
