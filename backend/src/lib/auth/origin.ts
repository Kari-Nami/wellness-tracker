import { getEnv } from '../env';
import { AppError } from '../http';
export function requireOrigin(request: Request) {
  if (request.headers.get('origin') !== getEnv().APP_ORIGIN)
    throw new AppError(
      403,
      'ORIGIN_DENIED',
      'This request origin is not allowed.',
    );
}
