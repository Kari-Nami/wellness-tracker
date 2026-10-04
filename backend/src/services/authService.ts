import { User } from '../models/User';
import { initializeDb } from '../lib/db/initialize';
import { withUserTransaction } from '../lib/db/transaction';
import { toUserDto } from '../lib/dto';
import { hashPassword, verifyPassword } from '../lib/auth/passwords';
import { AppError } from '../lib/http';
import {
  registerInputSchema,
  loginInputSchema,
  profilePatchSchema,
} from '../types/contracts';
export async function registerUser(payload: unknown) {
  const input = registerInputSchema.parse(payload);
  await initializeDb();
  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    email: input.email,
    displayName: input.displayName,
    timezone: input.timezone,
    passwordHash,
    role: 'user',
  });
  return toUserDto(user);
}
let dummyHash: Promise<string> | undefined;
export async function loginUser(payload: unknown) {
  const input = loginInputSchema.parse(payload);
  await initializeDb();
  const user = await User.findOne({ email: input.email }).select(
    '+passwordHash',
  );
  const encoded =
    user?.passwordHash ??
    (await (dummyHash ??= hashPassword('unused-timing-check')));
  const valid = await verifyPassword(input.password, encoded);
  if (!user || !valid)
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'The email or password is incorrect.',
    );
  return toUserDto(user);
}
export async function updateProfile(userId: string, payload: unknown) {
  const input = profilePatchSchema.parse(payload);
  return withUserTransaction(userId, async (user, session) => {
    user.set(input);
    await user.save({ session });
    return toUserDto(user);
  });
}
