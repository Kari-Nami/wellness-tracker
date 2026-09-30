import { describe, expect, it } from 'vitest';
import { normalizeBasePath } from './basePath';
describe('browser base path', () => {
  it('supports root and nested deployment', () => {
    expect(normalizeBasePath('/')).toBe('');
    expect(normalizeBasePath('/webdev/wellness-tracker/')).toBe(
      '/webdev/wellness-tracker',
    );
  });
  it.each([
    'https://example.com',
    '/a//b',
    '/a/../b',
    '/a?query',
    '/a;directive',
  ])('rejects unsafe path %s', (path) => {
    expect(() => normalizeBasePath(path)).toThrow();
  });
});
