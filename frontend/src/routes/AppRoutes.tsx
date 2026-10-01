import { Route, Routes } from 'react-router-dom';
import { ScaffoldPage } from '../pages/ScaffoldPage';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute, HomeRoute } from '../features/auth/RouteGuards';
import { AppShell } from '../components/layout/AppShell';
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<AppShell />}>
          {['today', 'calendar', 'insights', 'leaderboard', 'profile'].map(
            (route) => (
              <Route
                key={route}
                path={`/${route}`}
                element={<ScaffoldPage title={route} />}
              />
            ),
          )}
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<ScaffoldPage title="Admin" />} />
        </Route>
      </Route>
      <Route path="*" element={<ScaffoldPage title="Page not found" />} />
    </Routes>
  );
}
