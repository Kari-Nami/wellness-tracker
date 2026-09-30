import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: [
    'password',
    'passwordHash',
    'token',
    'jwt',
    'cookie',
    'authorization',
    'mongodbUri',
    'req.headers.cookie',
    'req.headers.authorization',
  ],
});
