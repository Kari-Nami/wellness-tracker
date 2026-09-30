import { normalizeBasePath } from './basePath';
export const appBasePath = normalizeBasePath(import.meta.env.BASE_URL);
export const apiBaseUrl = `${appBasePath}/api`;
export const appUrl = (path: string) =>
  `${appBasePath}/${path.replace(/^\//, '')}`;
