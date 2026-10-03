import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute, HomeRoute } from '../features/auth/RouteGuards';
import { AppShell } from '../components/layout/AppShell';
import { LoadingState } from '../components/ui/States';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouteEffects } from '../app/RouteEffects';
import { appBasePath } from '../config/app';
const CheckInPage = lazy(() =>
  import('../features/checkIn/CheckInPage').then((m) => ({
    default: m.CheckInPage,
  })),
);
const CalendarPage = lazy(() =>
  import('../features/calendar/CalendarPage').then((m) => ({
    default: m.CalendarPage,
  })),
);
const HistoricalCheckInPage = lazy(() =>
  import('../features/calendar/CalendarPage').then((m) => ({
    default: m.HistoricalCheckInPage,
  })),
);
const InsightsPage = lazy(() =>
  import('../features/insights/InsightsPage').then((m) => ({
    default: m.InsightsPage,
  })),
);
const ProfilePage = lazy(() =>
  import('../features/profile/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const LeaderboardPage = lazy(() =>
  import('../features/leaderboard/LeaderboardPage').then((m) => ({
    default: m.LeaderboardPage,
  })),
);
const AdminPage = lazy(() =>
  import('../features/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RouteFrame />} errorElement={<NotFoundPage />}>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<AuthPage key="login" mode="login" />} />
      <Route
        path="/register"
        element={<AuthPage key="register" mode="register" />}
      />
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<AppShell />}>
          <Route path="/today" element={<CheckInPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route
            path="/calendar/:localDate"
            element={<HistoricalCheckInPage />}
          />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
  { basename: appBasePath || '/' },
);
function RouteFrame() {
  return (
    <>
      <RouteEffects />
      <Outlet />
    </>
  );
}
export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState label="Getting things ready..." />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
