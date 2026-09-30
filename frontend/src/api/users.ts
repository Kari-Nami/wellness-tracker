import {
  userDtoSchema,
  profilePatchSchema,
  type ProfilePatch,
} from '../types/contracts';
import { request, jsonBody } from './client';
export const usersApi = {
  me: (signal?: AbortSignal) => request('/users/me', userDtoSchema, { signal }),
  update: (input: ProfilePatch) =>
    request(
      '/users/me',
      userDtoSchema,
      jsonBody('PATCH', profilePatchSchema.parse(input)),
    ),
};
