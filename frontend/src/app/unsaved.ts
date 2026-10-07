import { createContext, useContext, useEffect } from 'react';
export type UnsavedEntry = {
  dirty: boolean;
  busy: boolean;
  automatic?: boolean;
};
export const UnsavedContext = createContext<{
  dirty: boolean;
  busy: boolean;
  automatic: boolean;
  update: (key: string, entry: UnsavedEntry | null) => void;
} | null>(null);
export function useUnsaved() {
  const value = useContext(UnsavedContext);
  if (!value) throw new Error('Unsaved changes provider is missing.');
  return value;
}
export function useUnsavedChanges(
  key: string,
  dirty: boolean,
  busy = false,
  automatic = false,
) {
  const { update } = useUnsaved();
  useEffect(() => {
    update(key, { dirty, busy, automatic });
    return () => update(key, null);
  }, [key, dirty, busy, automatic, update]);
}
