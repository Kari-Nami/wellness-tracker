import {
  insightsDtoSchema,
  dateRangeSchema,
  type DateRange,
} from '../types/contracts';
import { request } from './client';
export const insightsApi = {
  get: (range: DateRange, signal?: AbortSignal) =>
    request(
      `/insights?${new URLSearchParams(dateRangeSchema.parse(range))}`,
      insightsDtoSchema,
      { signal },
    ),
};
