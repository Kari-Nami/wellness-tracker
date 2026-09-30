import { z } from 'zod';
import {
  pointRuleDtoSchema,
  pointTriggerDtoSchema,
  pointRuleInputSchema,
  pointRulePatchSchema,
  idSchema,
  type PointRuleInput,
  type PointRulePatch,
} from '../types/contracts';
import { request, jsonBody } from './client';
export const adminApi = {
  triggers: (signal?: AbortSignal) =>
    request('/admin/point-triggers', z.array(pointTriggerDtoSchema), {
      signal,
    }),
  rules: (signal?: AbortSignal) =>
    request('/admin/point-rules', z.array(pointRuleDtoSchema), { signal }),
  create: (input: PointRuleInput) =>
    request(
      '/admin/point-rules',
      pointRuleDtoSchema,
      jsonBody('POST', pointRuleInputSchema.parse(input)),
    ),
  update: (id: string, input: PointRulePatch) =>
    request(
      `/admin/point-rules/${idSchema.parse(id)}`,
      pointRuleDtoSchema,
      jsonBody('PATCH', pointRulePatchSchema.parse(input)),
    ),
  remove: (id: string) =>
    request(`/admin/point-rules/${idSchema.parse(id)}`, z.undefined(), {
      method: 'DELETE',
    }),
};
