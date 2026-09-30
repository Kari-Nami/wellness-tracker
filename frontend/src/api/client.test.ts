import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, request, setUnauthorizedHandler } from './client';
afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(undefined);
});
describe('API boundary', () => {
  it('unwraps validated data and includes cookie credentials', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { value: 2 } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await request('/sample', z.object({ value: z.number() }))).toEqual({
      value: 2,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sample',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
  it('rejects malformed successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ data: { value: 'invalid' } })),
    );
    await expect(
      request('/sample', z.object({ value: z.number() })),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('accepts a bodyless delete response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(
      request('/sample', z.undefined(), { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });
  it('preserves server errors and notifies session expiration', async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { code: 'UNAUTHENTICATED', message: 'Sign in again.' } },
            { status: 401 },
          ),
        ),
    );
    await expect(request('/auth/me', z.unknown())).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(expired).toHaveBeenCalledOnce();
  });
  it('does not treat an invalid login as session expiration', async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(request('/auth/login', z.unknown())).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(expired).not.toHaveBeenCalled();
  });
  it('normalizes network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    await expect(request('/sample', z.unknown())).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });
});
