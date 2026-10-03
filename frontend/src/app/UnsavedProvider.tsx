import { useCallback, useState, type ReactNode } from 'react';
import { UnsavedContext, type UnsavedEntry } from './unsaved';
export function UnsavedProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, UnsavedEntry>>({});
  const update = useCallback((key: string, entry: UnsavedEntry | null) => {
    setEntries((previous) => {
      if (!entry) {
        if (!previous[key]) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      }
      if (
        previous[key]?.dirty === entry.dirty &&
        previous[key]?.busy === entry.busy
      )
        return previous;
      return { ...previous, [key]: entry };
    });
  }, []);
  return (
    <UnsavedContext.Provider
      value={{
        dirty: Object.values(entries).some((e) => e.dirty),
        busy: Object.values(entries).some((e) => e.busy),
        update,
      }}
    >
      {children}
    </UnsavedContext.Provider>
  );
}
