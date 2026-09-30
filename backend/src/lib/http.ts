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
    return await request.json();
  } catch {
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
