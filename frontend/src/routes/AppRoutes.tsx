import { Navigate, Route, Routes } from 'react-router-dom';
import { ScaffoldPage } from '../pages/ScaffoldPage';
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/today" replace />} />
      {[
        'login',
        'register',
        'today',
        'calendar',
        'insights',
        'leaderboard',
        'profile',
        'admin',
      ].map((route) => (
        <Route
          key={route}
          path={`/${route}`}
          element={
            <ScaffoldPage title={route[0].toUpperCase() + route.slice(1)} />
          }
        />
      ))}
      <Route path="*" element={<ScaffoldPage title="Page not found" />} />
    </Routes>
  );
}
