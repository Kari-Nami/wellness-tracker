import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context';
import { ErrorState, LoadingState } from '../../components/ui/States';
export function ProtectedRoute({ role }: { role?: 'user' | 'admin' }) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState label="Getting things ready..." />;
  if (error) return <ErrorState error={error} retry={refresh} />;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (role && user.role !== role)
    return (
      <Navigate to={user.role === 'admin' ? '/admin' : '/today'} replace />
    );
  return <Outlet />;
}
export function HomeRoute() {
  const { user, loading, error, refresh } = useAuth();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={refresh} />;
  return (
    <Navigate
      to={!user ? '/login' : user.role === 'admin' ? '/admin' : '/today'}
      replace
    />
  );
}
