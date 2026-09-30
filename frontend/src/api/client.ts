import { z } from 'zod';
import { apiErrorSchema, successEnvelope } from '../types/contracts';
import { apiBaseUrl } from '../config/app';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
let unauthorizedHandler: (() => void) | undefined;
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler;
}
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the server. Try again.',
    );
  }
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(
      await response.json().catch(() => null),
    );
    if (
      response.status === 401 &&
      path !== '/auth/login' &&
      path !== '/auth/register'
    )
      unauthorizedHandler?.();
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : 'HTTP_ERROR',
      parsed.success
        ? parsed.data.error.message
        : 'The request could not be completed.',
      parsed.success ? parsed.data.error.details : undefined,
    );
  }
  if (response.status === 204) return schema.parse(undefined);
  const parsed = successEnvelope(schema).safeParse(
    await response.json().catch(() => null),
  );
  if (!parsed.success)
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'The server returned an unexpected response.',
    );
  return parsed.data.data;
}
export const jsonBody = (method: string, data: unknown): RequestInit => ({
  method,
  body: JSON.stringify(data),
});
