import { isIP } from 'node:net';
import { AppError } from '../http';
const state = globalThis as typeof globalThis & {
  daywellAuthAttempts?: Map<string, { count: number; expires: number }>;
};
export function throttleAuth(request: Request) {
  const attempts = (state.daywellAuthAttempts ??= new Map());
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.expires <= now) attempts.delete(key);
  const header = request.headers.get('x-real-ip') ?? '';
  const key = isIP(header) ? header : 'local';
  const entry = attempts.get(key) ?? { count: 0, expires: now + 60000 };
  if (entry.count >= 20 || (attempts.size >= 10000 && !attempts.has(key)))
    throw new AppError(
      429,
      'RATE_LIMITED',
      'Too many sign-in attempts. Please wait a minute and try again.',
    );
  entry.count++;
  attempts.set(key, entry);
}
