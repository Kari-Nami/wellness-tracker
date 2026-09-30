import { z } from 'zod';
import {
  checkInDtoSchema,
  checkInSummarySchema,
  createCheckInInputSchema,
  checkInPatchSchema,
  dateRangeSchema,
  localDateSchema,
  type DateRange,
  type CreateCheckInInput,
  type CheckInPatch,
} from '../types/contracts';
import { request, jsonBody } from './client';
const date = (value: string) => localDateSchema.parse(value);
function rangeQuery(range: DateRange) {
  return new URLSearchParams(dateRangeSchema.parse(range)).toString();
}
export const checkInsApi = {
  get: (localDate: string, signal?: AbortSignal) =>
    request(`/check-ins/${date(localDate)}`, checkInDtoSchema, { signal }),
  list: (range: DateRange, signal?: AbortSignal) =>
    request(`/check-ins?${rangeQuery(range)}`, z.array(checkInDtoSchema), {
      signal,
    }),
  summaries: (range: DateRange, signal?: AbortSignal) =>
    request(
      `/check-ins?${rangeQuery(range)}&view=summary`,
      z.array(checkInSummarySchema),
      { signal },
    ),
  create: (input: CreateCheckInInput) =>
    request(
      '/check-ins',
      checkInDtoSchema,
      jsonBody('POST', createCheckInInputSchema.parse(input)),
    ),
  update: (localDate: string, input: CheckInPatch) =>
    request(
      `/check-ins/${date(localDate)}`,
      checkInDtoSchema,
      jsonBody('PATCH', checkInPatchSchema.parse(input)),
    ),
  remove: (localDate: string) =>
    request(`/check-ins/${date(localDate)}`, z.undefined(), {
      method: 'DELETE',
    }),
};
