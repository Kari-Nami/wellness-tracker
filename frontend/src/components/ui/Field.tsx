import type { ReactNode } from 'react';
function fieldMessage(label: string, error: string) {
  const name = label.toLowerCase();
  if (name.includes('email')) return 'Enter a valid email address.';
  if (name === 'password')
    return 'Use a password between 8 and 128 characters.';
  if (name.includes('timezone'))
    return 'Use a valid timezone, such as Asia/Bangkok.';
  if (name.includes('water target'))
    return 'Choose a water target between 0 and 10 liters.';
  if (name.includes('sleep target'))
    return 'Choose a sleep target between 0 and 24 hours.';
  if (name === 'meals per day')
    return 'Choose a whole number between 0 and 10.';
  if (name === 'points awarded')
    return 'Choose a whole number between 0 and 100.';
  if (name === 'habit name')
    return 'Give this habit a name between 1 and 80 characters.';
  if (name === 'display name' || name === 'your name')
    return 'Use a name between 1 and 50 characters.';
  if (name.includes('detail') || name.includes('description'))
    return 'Keep this description to 200 characters or fewer.';
  return error;
}
export function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-help`} role="alert">
          {fieldMessage(label, error)}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={`${id}-help`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
