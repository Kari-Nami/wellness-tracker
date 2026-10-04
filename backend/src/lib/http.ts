import { ZodError } from 'zod';
import { logger } from './logger';
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
export function success<T>(data: T, status = 200) {
  return Response.json(
    { data },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
export function noContent() {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
export function notImplemented(): never {
  throw new AppError(
    501,
    'NOT_IMPLEMENTED',
    'This endpoint is scaffolded and has not been implemented yet.',
  );
}
export async function readJson(request: Request): Promise<unknown> {
  try {
    if (
      !request.headers
        .get('content-type')
        ?.toLowerCase()
        .startsWith('application/json')
    )
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Use an application/json request body.',
      );
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 65536)
      throw new AppError(
        413,
        'PAYLOAD_TOO_LARGE',
        'This request is too large.',
      );
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'The request body must be valid JSON.',
    );
  }
}
export async function handleRoute(
  operation: () => Response | Promise<Response>,
): Promise<Response> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The submitted data is invalid.',
            details: { issues: error.issues },
          },
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    if (error instanceof AppError)
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      );
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    )
      return Response.json(
        { error: { code: 'CONFLICT', message: 'This record already exists.' } },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    if (
      error instanceof Error &&
      (/^Mongo(?:Network|ServerSelection|NotConnected|TopologyClosed|Timeout)/.test(
        error.name,
      ) ||
        ('code' in error && error.code === 20))
    )
      return Response.json(
        {
          error: {
            code: 'DEPENDENCY_UNAVAILABLE',
            message:
              'The database is unavailable or cannot complete this operation.',
          },
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    // Do not log exception messages that could contain database credentials or wellness payloads.
    logger.error(
      { errorType: error instanceof Error ? error.name : 'UnknownError' },
      'Unhandled API error',
    );
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'The request could not be completed.',
        },
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
