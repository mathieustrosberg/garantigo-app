/**
 * Purchase dates are stored as 'YYYY-MM-DD' text: a day, with no time and no time zone.
 * These helpers convert between that text and the `Date` objects used by the date picker.
 */

const STORED_DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Reads the day shown on the phone (local time) and returns it as 'YYYY-MM-DD'. */
export function toStoredDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the local `Date` of a stored day, or null when the text is not a real date. */
export function fromStoredDate(storedDate: string): Date | null {
  const match = STORED_DATE_FORMAT.exec(storedDate);
  if (match === null) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);

  // `new Date(2026, 1, 30)` silently becomes March 2nd: reject dates that do not exist.
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

export function isStoredDate(value: string): boolean {
  return fromStoredDate(value) !== null;
}

export function getToday(): string {
  return toStoredDate(new Date());
}

/** Formats a stored day for the interface, for example '18 novembre 2026'. */
export function formatStoredDate(storedDate: string): string {
  const date = fromStoredDate(storedDate);
  if (date === null) return storedDate;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
