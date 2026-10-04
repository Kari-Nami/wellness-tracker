import { handleRoute, noContent } from '@/lib/http';
import { requireOrigin } from '@/lib/auth/origin';
import { attachSession } from '@/lib/auth/session';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return handleRoute(() => {
    requireOrigin(request);
    return attachSession(noContent(), null);
  });
}
