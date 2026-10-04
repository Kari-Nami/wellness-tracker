import { dateRangeSchema } from '../../types/contracts';
import { AppError } from '../http';
export function rangeFromRequest(request: Request) {
  const params = new URL(request.url).searchParams;
  return dateRangeSchema.parse({
    from: params.get('from'),
    to: params.get('to'),
  });
}
export function booleanQuery(request: Request, key: string) {
  const value = new URL(request.url).searchParams.get(key);
  if (value !== null && value !== 'true' && value !== 'false')
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${key} must be true or false.`,
    );
  return value === 'true';
}
