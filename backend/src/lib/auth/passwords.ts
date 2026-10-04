import { createHash } from 'node:crypto';
import { hash, compare } from 'bcryptjs';
// Domain-separated prehashing preserves the full 128-character input within bcrypt's byte limit.
const digest = (password: string) =>
  createHash('sha256')
    .update('daywell:password:v1\0')
    .update(password, 'utf8')
    .digest('base64');
export async function hashPassword(password: string) {
  return `sha256-bcrypt:${await hash(digest(password), 12)}`;
}
export async function verifyPassword(password: string, encoded: string) {
  return (
    encoded.startsWith('sha256-bcrypt:') &&
    compare(digest(password), encoded.slice('sha256-bcrypt:'.length))
  );
}
