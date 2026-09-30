import { z } from 'zod';
export function normalizeBasePath(value: string): string {
  if (value === '/' || value === '') return '/';
  const path = value.replace(/\/$/, '');
  if (!/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path))
    throw new Error('Invalid PUBLIC_BASE_PATH.');
  return path;
}
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_ORIGIN: z.url().refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'APP_ORIGIN must be an HTTP(S) origin without a path or trailing slash.'),
  PUBLIC_BASE_PATH: z.string().default('/').transform(normalizeBasePath),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});
export function getEnv() {
  return envSchema.parse(process.env);
}
