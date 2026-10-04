import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from './passwords';
import { attachSession, sessionLifetime } from './session';
import { requireOrigin } from './origin';
import { throttleAuth } from './throttle';
beforeEach(() => {
  vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/test');
  vi.stubEnv('JWT_SECRET', 'test-secret-of-at-least-thirty-two-characters');
  vi.stubEnv('APP_ORIGIN', 'https://example.com');
  vi.stubEnv('PUBLIC_BASE_PATH', '/wellness');
});
afterEach(() => vi.unstubAllEnvs());
describe('authentication safeguards', () => {
  it('checks all password bytes beyond bcrypt truncation boundaries', async () => {
    const password = 'a'.repeat(80) + 'first';
    const encoded = await hashPassword(password);
    expect(await verifyPassword(password, encoded)).toBe(true);
    expect(await verifyPassword('a'.repeat(80) + 'second', encoded)).toBe(
      false,
    );
  });
  it('scopes production cookies and logout consistently', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const active = attachSession(new Response(), 'token').headers.get(
      'Set-Cookie',
    )!;
    const cleared = attachSession(new Response(), null).headers.get(
      'Set-Cookie',
    )!;
    for (const attribute of [
      'Path=/wellness',
      'HttpOnly',
      'SameSite=Lax',
      'Secure',
    ]) {
      expect(active).toContain(attribute);
      expect(cleared).toContain(attribute);
    }
    expect(cleared).toContain('Max-Age=0');
    expect(sessionLifetime('7d')).toBe(604800);
    expect(() => sessionLifetime('0d')).toThrow();
  });
  it('rejects missing and mismatched origins and limits repeated attempts', () => {
    expect(() =>
      requireOrigin(new Request('https://example.com/api')),
    ).toThrow();
    expect(() =>
      requireOrigin(
        new Request('https://example.com/api', {
          headers: { Origin: 'https://elsewhere.example' },
        }),
      ),
    ).toThrow();
    expect(() =>
      requireOrigin(
        new Request('https://example.com/api', {
          headers: { Origin: 'https://example.com' },
        }),
      ),
    ).not.toThrow();
    const attempt = new Request('https://example.com/api', {
      headers: { 'X-Real-IP': '192.0.2.123' },
    });
    for (let i = 0; i < 20; i++) throttleAuth(attempt);
    expect(() => throttleAuth(attempt)).toThrow();
  });
});
