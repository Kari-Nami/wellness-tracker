import { useSyncExternalStore } from 'react';
import { todayInZone } from '../lib/dates';
function subscribe(listener: () => void) {
  const timer = window.setInterval(listener, 30_000);
  return () => window.clearInterval(timer);
}
export function useToday(timezone: string) {
  return useSyncExternalStore(subscribe, () => todayInZone(timezone));
}
