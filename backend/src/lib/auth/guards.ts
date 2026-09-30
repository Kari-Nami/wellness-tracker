import type { UserDto } from '../../types/contracts';
import { notImplemented } from '../http';
// Core backend developer owns these signatures. Resolve the persisted user on each request.
export async function requireUser(request: Request): Promise<UserDto> {
  void request;
  return notImplemented();
}
export async function requireAdmin(request: Request): Promise<UserDto> {
  void request;
  return notImplemented();
}
