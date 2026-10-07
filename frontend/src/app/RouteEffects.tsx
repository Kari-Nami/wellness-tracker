import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const labels: Record<string, string> = {
      today: 'Your daily check-in',
      calendar: 'Your history',
      insights: 'Your insights',
      leaderboard: 'Community board',
      profile: 'Your profile',
      habits: 'Habits',
      admin: 'Point configuration',
      login: 'Sign in',
      register: 'Create account',
    };
    const label = labels[pathname.split('/')[1]];
    document.title = label ? `${label} | Wellness Tracker` : 'Wellness Tracker';
    if (hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'instant' }),
      );
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);
  return null;
}
