import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, type AuthState } from './context';
import { AuthPage } from './AuthPage';
import { DEMO_ACCOUNTS } from '../../types/demoAccounts';
import { createDemoDatabase } from '../../mocks/data';
function page(
  mode: 'login' | 'register' = 'login',
  role: 'user' | 'admin' = 'user',
) {
  const login = vi
    .fn()
    .mockResolvedValue({ ...createDemoDatabase().accounts[0].user, role });
  const auth: AuthState = {
    user: null,
    loading: false,
    error: null,
    login,
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<AuthPage mode={mode} />} />
          <Route path="/today" element={<p>Member workspace</p>} />
          <Route path="/admin" element={<p>Rule editor</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return login;
}
it('shows plaintext credentials and fills both inputs without signing in', () => {
  const login = page();
  expect(screen.getByText('wellness123')).toBeInTheDocument();
  for (const account of DEMO_ACCOUNTS)
    expect(screen.getByText(account.email)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Fill Maya Chen credentials' }),
  );
  expect(screen.getByLabelText('Email address')).toHaveValue(
    DEMO_ACCOUNTS[1].email,
  );
  expect(screen.getByLabelText('Password', { exact: true })).toHaveValue(
    DEMO_ACCOUNTS[1].password,
  );
  expect(login).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Fill Maya Chen credentials' }),
  ).toHaveAttribute('aria-pressed', 'true');
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
    target: { value: '' },
  });
  expect(
    screen.getByRole('button', { name: 'Fill Maya Chen credentials' }),
  ).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(
    screen.getByRole('button', { name: 'Fill Alex Morgan credentials' }),
  );
  expect(screen.getByLabelText('Email address')).toHaveValue(
    DEMO_ACCOUNTS[0].email,
  );
});
it('signs in to the administrator route only after explicitly submitting the filled form', async () => {
  const login = page('login', 'admin');
  const admin = DEMO_ACCOUNTS.find((a) => a.role === 'admin')!;
  fireEvent.click(
    screen.getByRole('button', { name: 'Fill Demo administrator credentials' }),
  );
  expect(login).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith({
      email: admin.email,
      password: admin.password,
    }),
  );
  expect(await screen.findByText('Rule editor')).toBeInTheDocument();
});
it('keeps demo shortcuts off the personal registration form', () => {
  page('register');
  expect(screen.queryByText('Try Wellness Tracker')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Create account' }),
  ).toBeInTheDocument();
});
