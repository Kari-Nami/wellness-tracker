import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError, handleRoute, notImplemented } from './http';
import { GET } from '../app/api/health/route';
vi.mock('./logger', () => ({ logger: { error: vi.fn() } }));
describe('route responses', () => {
  it('reports live process without requiring a database', async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { status: 'ok', contractVersion: '1.0.0' },
    });
  });
  it('makes scaffold routes explicitly unimplemented', async () => {
    const response = await handleRoute(() => notImplemented());
    expect(response.status).toBe(501);
    expect(await response.json()).toMatchObject({
      error: { code: 'NOT_IMPLEMENTED' },
    });
  });
  it('maps payload validation to 400 and domain conflicts to 409', async () => {
    expect(
      (
        await handleRoute(() => {
          z.string().parse(2);
          return new Response();
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await handleRoute(() => {
          throw new AppError(409, 'CONFLICT', 'Duplicate record.');
        })
      ).status,
    ).toBe(409);
  });
  it('does not expose unexpected exception details', async () => {
    const response = await handleRoute(() => {
      throw new Error('private connection details');
    });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(
      'private connection details',
    );
  });
});
