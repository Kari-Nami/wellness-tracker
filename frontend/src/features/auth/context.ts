import { createContext, useContext } from 'react';
import type { UserDto, LoginInput, RegisterInput } from '../../types/contracts';
export interface AuthState {
  user: UserDto | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  login: (input: LoginInput) => Promise<UserDto>;
  register: (input: RegisterInput) => Promise<UserDto>;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Authentication provider is missing.');
  return context;
}
