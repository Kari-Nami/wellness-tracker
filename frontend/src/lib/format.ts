export const waterLabel = (ml: number | null) =>
  ml === null ? 'Not logged' : `${Number((ml / 1000).toFixed(2))} L`;
export const sleepLabel = (minutes: number | null) =>
  minutes === null
    ? 'Not logged'
    : `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim();
export const rateLabel = (value: number | null) =>
  value === null ? 'No data' : `${Math.round(value)}%`;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
export const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
