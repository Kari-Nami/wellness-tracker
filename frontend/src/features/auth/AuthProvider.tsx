import { useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { ApiError, setUnauthorizedHandler } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import { AuthContext } from './context';
import type { UserDto, LoginInput, RegisterInput } from '../../types/contracts';
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.auth,
    queryFn: async ({ signal }): Promise<UserDto | null> => {
      try {
        return await authApi.me(signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  const clearPrivateData = () =>
    client.removeQueries({
      predicate: (entry) => entry.queryKey[0] !== 'auth',
    });
  useEffect(() => {
    setUnauthorizedHandler(() => {
      client.setQueryData(queryKeys.auth, null);
      client.removeQueries({
        predicate: (entry) => entry.queryKey[0] !== 'auth',
      });
    });
    return () => setUnauthorizedHandler(undefined);
  }, [client]);
  async function authenticated(operation: () => Promise<UserDto>) {
    const user = await operation();
    await client.cancelQueries();
    clearPrivateData();
    client.setQueryData(queryKeys.auth, user);
    return user;
  }
  const login = (input: LoginInput) =>
    authenticated(() => authApi.login(input));
  const register = (input: RegisterInput) =>
    authenticated(() => authApi.register(input));
  async function logout() {
    await authApi.logout();
    await client.cancelQueries();
    clearPrivateData();
    client.setQueryData(queryKeys.auth, null);
  }
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        loading: query.isPending,
        error: query.error,
        refresh: () => {
          void query.refetch();
        },
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
