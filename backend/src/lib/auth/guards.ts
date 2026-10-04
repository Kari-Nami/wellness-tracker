import type { UserDto } from '../../types/contracts';
import { initializeDb } from '../db/initialize';
import { User } from '../../models/User';
import { toUserDto } from '../dto';
import { AppError } from '../http';
import { readSession } from './session';
export async function requireUser(request: Request): Promise<UserDto> {
  const id = await readSession(request);
  if (!id)
    throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  await initializeDb();
  const user = await User.findById(id);
  if (!user)
    throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
  return toUserDto(user);
}
export async function requireAdmin(request: Request): Promise<UserDto> {
  const user = await requireUser(request);
  if (user.role !== 'admin')
    throw new AppError(
      403,
      'FORBIDDEN',
      'This page is available to administrators only.',
    );
  return user;
}
