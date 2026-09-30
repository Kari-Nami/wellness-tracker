import { Link } from 'react-router-dom';
export function ScaffoldPage({ title }: { title: string }) {
  return (
    <main>
      <p>Wellness Tracker scaffold</p>
      <h1>{title}</h1>
      <p>
        This route is ready for frontend implementation. Authentication and
        product screens are not implemented yet.
      </p>
      <nav aria-label="Scaffold routes">
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
          <Link key={route} to={`/${route}`}>
            {route}
          </Link>
        ))}
      </nav>
    </main>
  );
}
