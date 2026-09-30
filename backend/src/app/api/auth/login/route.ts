import { handleRoute, notImplemented } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function POST() {
  return handleRoute(() => notImplemented());
}
