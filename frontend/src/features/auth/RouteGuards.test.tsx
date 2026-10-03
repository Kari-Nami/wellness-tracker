import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, type AuthState } from './context';
import { ProtectedRoute } from './RouteGuards';
import { createDemoDatabase } from '../../mocks/data';
const base: AuthState = {
  user: null,
  loading: false,
  error: null,
  refresh: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};
function guard(state: Partial<AuthState>) {
  return render(
    <AuthContext.Provider value={{ ...base, ...state }}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<p>Rule editor</p>} />
          </Route>
          <Route path="/login" element={<p>Sign-in screen</p>} />
          <Route path="/today" element={<p>Daily space</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
describe('protected routes', () => {
  it('redirects signed-out visitors to sign in', () => {
    guard({});
    expect(screen.getByText('Sign-in screen')).toBeInTheDocument();
  });
  it('denies the administrator route to members', () => {
    guard({ user: createDemoDatabase().accounts[0].user });
    expect(screen.getByText('Daily space')).toBeInTheDocument();
  });
  it('allows the persisted administrator role', () => {
    guard({ user: createDemoDatabase().accounts[1].user });
    expect(screen.getByText('Rule editor')).toBeInTheDocument();
  });
  it('shows connection errors instead of treating the visitor as signed out', () => {
    guard({ error: new Error('Connection unavailable') });
    expect(screen.getByText('Connection unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Sign-in screen')).not.toBeInTheDocument();
  });
});
