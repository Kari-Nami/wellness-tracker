export function normalizeBasePath(value: string): string {
  if (value === '/' || value === '') return '';
  const path = value.replace(/\/$/, '');
  if (!/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(path)) {
    throw new Error(
      'Base path must be / or a path of letters, numbers, underscores and hyphens.',
    );
  }
  return path;
}
