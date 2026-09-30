import { handleRoute, notImplemented } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function PATCH() {
  return handleRoute(() => notImplemented());
}
export async function DELETE() {
  return handleRoute(() => notImplemented());
}
