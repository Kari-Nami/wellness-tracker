import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {
  Sun,
  CalendarDays,
  ChartNoAxesCombined,
  Trophy,
  UserRound,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Leaf,
} from 'lucide-react';
import { Brand } from '../ui/Brand';
import { useAuth } from '../../features/auth/context';
import { initials } from '../../lib/format';
import { isDemoMode } from '../../config/mode';
const navigation = [
  { path: '/today', label: 'Today', icon: Sun },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/insights', label: 'Insights', icon: ChartNoAxesCombined },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: UserRound },
];
export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const user = auth.user!;
  const admin = user.role === 'admin';
  async function logout() {
    setPending(true);
    setError('');
    try {
      await auth.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sign out failed. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {admin ? (
              <NavLink to="/admin">
                <SlidersHorizontal size={15} />
                Point rules
              </NavLink>
            ) : (
              navigation.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path}>
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))
            )}
          </nav>
          <Dropdown.Root>
            <Dropdown.Trigger
              className="user-menu-trigger"
              aria-label="Account menu"
            >
              <span className="avatar">{initials(user.displayName)}</span>
              <span className="user-menu-name">
                {user.displayName.split(' ')[0]}
              </span>
              <ChevronDown size={13} />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                className="dropdown-content"
                align="end"
                sideOffset={10}
              >
                <div className="dropdown-account">
                  <strong>{user.displayName}</strong>
                  <span>{user.email}</span>
                </div>
                {!admin && (
                  <Dropdown.Item asChild>
                    <Link to="/profile">
                      <UserRound size={15} /> Profile & preferences
                    </Link>
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                  disabled={pending}
                  onSelect={() => void logout()}
                >
                  <LogOut size={15} />
                  {pending ? 'Signing out...' : 'Sign out'}
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
      </header>
      {isDemoMode && (
        <div className="demo-banner">
          Sample workspace <span>Changes stay on this device</span>
        </div>
      )}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>
          <Leaf size={13} /> A little progress, every day.
        </span>
        <span>Your wellness. Your pace.</span>
      </footer>
      {!admin && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
