import { handleRoute, readJson, success } from '@/lib/http';
import { requireOrigin } from '@/lib/auth/origin';
import { throttleAuth } from '@/lib/auth/throttle';
import { createSession, attachSession } from '@/lib/auth/session';
import { loginUser } from '@/services/authService';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return handleRoute(async () => {
    requireOrigin(request);
    throttleAuth(request);
    const user = await loginUser(await readJson(request));
    return attachSession(success(user, 200), await createSession(user));
  });
}
