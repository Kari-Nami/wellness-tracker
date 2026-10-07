import { z } from 'zod';
import {
  habitDtoSchema,
  habitInputSchema,
  habitPatchSchema,
  idSchema,
  type HabitInput,
  type HabitPatch,
} from '../types/contracts';
import { request, jsonBody } from './client';
export const habitsApi = {
  list: (signal?: AbortSignal) =>
    request('/habits', z.array(habitDtoSchema), { signal }),
  get: (id: string) => request(`/habits/${idSchema.parse(id)}`, habitDtoSchema),
  create: (input: HabitInput) =>
    request(
      '/habits',
      habitDtoSchema,
      jsonBody('POST', habitInputSchema.parse(input)),
    ),
  update: (id: string, input: HabitPatch) =>
    request(
      `/habits/${idSchema.parse(id)}`,
      habitDtoSchema,
      jsonBody('PATCH', habitPatchSchema.parse(input)),
    ),
  remove: (id: string) =>
    request(`/habits/${idSchema.parse(id)}`, z.undefined(), {
      method: 'DELETE',
    }),
};
