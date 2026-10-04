import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '../env';
import { idSchema, roleSchema, type UserDto } from '../../types/contracts';
export const SESSION_COOKIE = 'wellness_session';
export function sessionLifetime(value: string) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error('JWT_EXPIRES_IN must be a duration such as 7d.');
  const seconds =
    Number(match[1]) *
    { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  if (seconds < 60 || seconds > 30 * 86400)
    throw new Error(
      'Session lifetime must be between one minute and thirty days.',
    );
  return seconds;
}
export async function createSession(user: Pick<UserDto, 'id' | 'role'>) {
  const env = getEnv();
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuer('daywell')
    .setAudience('daywell-web')
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + sessionLifetime(env.JWT_EXPIRES_IN),
    )
    .sign(new TextEncoder().encode(env.JWT_SECRET));
}
export async function readSession(request: Request): Promise<string | null> {
  const cookie = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  try {
    const token = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
    if (token.length > 2048) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(getEnv().JWT_SECRET),
      { algorithms: ['HS256'], issuer: 'daywell', audience: 'daywell-web' },
    );
    roleSchema.parse(payload.role);
    return idSchema.parse(payload.sub);
  } catch {
    return null;
  }
}
export function attachSession(response: Response, token: string | null) {
  const env = getEnv();
  const cookie = [
    `${SESSION_COOKIE}=${token ? encodeURIComponent(token) : ''}`,
    `Path=${env.PUBLIC_BASE_PATH}`,
    `Max-Age=${token ? sessionLifetime(env.JWT_EXPIRES_IN) : 0}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (env.NODE_ENV === 'production') cookie.push('Secure');
  if (!token) cookie.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  response.headers.append('Set-Cookie', cookie.join('; '));
  return response;
}
