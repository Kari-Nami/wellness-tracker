import { useEffect } from 'react';
import { useUnsaved } from './unsaved';
export function UnloadProtection() {
  const { dirty, busy } = useUnsaved();
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty || busy) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, busy]);
  return null;
}
