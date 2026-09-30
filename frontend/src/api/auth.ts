import { z } from 'zod';
import {
  userDtoSchema,
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from '../types/contracts';
import { request, jsonBody } from './client';
export const authApi = {
  me: (signal?: AbortSignal) => request('/auth/me', userDtoSchema, { signal }),
  login: (input: LoginInput) =>
    request(
      '/auth/login',
      userDtoSchema,
      jsonBody('POST', loginInputSchema.parse(input)),
    ),
  register: (input: RegisterInput) =>
    request(
      '/auth/register',
      userDtoSchema,
      jsonBody('POST', registerInputSchema.parse(input)),
    ),
  logout: () => request('/auth/logout', z.undefined(), { method: 'POST' }),
};
