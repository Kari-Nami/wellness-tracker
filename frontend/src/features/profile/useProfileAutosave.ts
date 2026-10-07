import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { queryKeys } from '../../api/queryKeys';
import {
  profilePatchSchema,
  type UserDto,
  type ProfilePatch,
} from '../../types/contracts';
import { useUnsavedChanges } from '../../app/unsaved';
const fields = (user: UserDto) => ({
  displayName: user.displayName,
  leaderboardEnabled: user.leaderboardEnabled,
  goals: user.goals,
});
export function useProfileAutosave(user: UserDto) {
  const client = useQueryClient();
  const [draft, setDraft] = useState(() => fields(user));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const queued = useRef<ProfilePatch | null>(null);
  const sending = useRef(false);
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useUnsavedChanges(
    'profile-autosave',
    status === 'saving' || status === 'error',
    status === 'saving',
    status === 'saving',
  );
  const flush = useCallback(async () => {
    if (sending.current || !queued.current) return;
    sending.current = true;
    try {
      while (queued.current) {
        const input = queued.current;
        queued.current = null;
        const submitted = revision.current;
        try {
          const parsed = profilePatchSchema.safeParse(input);
          if (!parsed.success)
            throw new Error(
              parsed.error.issues[0]?.message ?? 'Check your profile values.',
            );
          const result = await usersApi.update(parsed.data);
          const current = client.getQueryData<UserDto | null>(queryKeys.auth);
          if (current?.id !== user.id) return;
          client.setQueryData(queryKeys.auth, result);
          client.setQueryData(queryKeys.profile, result);
          if (revision.current === submitted) setDraft(fields(result));
        } catch (err) {
          const newer = queued.current as ProfilePatch | null;
          queued.current = { ...input, ...(newer ?? {}) };
          setError(
            err instanceof Error
              ? err.message
              : 'Your changes could not be saved.',
          );
          setStatus('error');
          return;
        }
      }
      setError('');
      setStatus('saved');
      void client.invalidateQueries({ queryKey: ['insights'] });
      void client.invalidateQueries({ queryKey: queryKeys.leaderboard });
    } finally {
      sending.current = false;
    }
  }, [client, user.id]);
  const change = (patch: ProfilePatch, immediate = false) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    queued.current = { ...queued.current, ...patch };
    revision.current++;
    setError('');
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void flush();
    else timer.current = setTimeout(() => void flush(), 400);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return {
    draft,
    change,
    status,
    error,
    retry: () => {
      setStatus('saving');
      void flush();
    },
  };
}
