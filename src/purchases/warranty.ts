import type { Purchase } from './purchase';
import { fromStoredDate } from './purchase-date';

export type WarrantyStatus = 'active' | 'expiringSoon' | 'expired';

export type Warranty = {
  /** Last day covered by the warranty, formatted as 'YYYY-MM-DD'. */
  endDate: string;
  /** Days from today to the end date: 0 on the last day, negative once it has passed. */
  remainingDays: number;
  status: WarrantyStatus;
};

/** A warranty "expires soon" from this many days before its end date, bounds included. */
export const EXPIRING_SOON_DAYS = 30;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

type Day = { year: number; monthIndex: number; day: number };

/** Reads a stored 'YYYY-MM-DD' day, or throws when the day does not exist. */
function parseDay(storedDate: string): Day {
  const date = fromStoredDate(storedDate);
  if (date === null) {
    throw new Error(`Invalid date: "${storedDate}"`);
  }
  return { year: date.getFullYear(), monthIndex: date.getMonth(), day: date.getDate() };
}

function formatDay({ year, monthIndex, day }: Day): string {
  const month = String(monthIndex + 1).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${month}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Adds the warranty duration to the purchase date. When the day does not exist in the
 * target month, the last day of that month is used: January 31 + 1 month = February 28 or 29.
 */
export function getWarrantyEndDate(purchaseDate: string, warrantyMonths: number): string {
  if (!Number.isInteger(warrantyMonths) || warrantyMonths <= 0) {
    throw new Error(`Invalid warranty duration: ${warrantyMonths}`);
  }

  const start = parseDay(purchaseDate);
  const totalMonths = start.monthIndex + warrantyMonths;
  const year = start.year + Math.floor(totalMonths / 12);
  const monthIndex = totalMonths % 12;
  const day = Math.min(start.day, getDaysInMonth(year, monthIndex));

  return formatDay({ year, monthIndex, day });
}

/**
 * Counts the days from `today` to `endDate`. Both days are converted to UTC midnight, where
 * every day lasts exactly 24 hours, so daylight saving time never shifts the result.
 */
export function getRemainingDays(endDate: string, today: string): number {
  const end = parseDay(endDate);
  const start = parseDay(today);
  const difference =
    Date.UTC(end.year, end.monthIndex, end.day) - Date.UTC(start.year, start.monthIndex, start.day);

  return Math.round(difference / MILLISECONDS_PER_DAY);
}

export function getWarrantyStatus(remainingDays: number): WarrantyStatus {
  if (remainingDays < 0) return 'expired';
  if (remainingDays <= EXPIRING_SOON_DAYS) return 'expiringSoon';
  return 'active';
}

/** `today` is a parameter so that the result never depends on the real date. */
export function getWarranty(
  purchase: Pick<Purchase, 'purchaseDate' | 'warrantyMonths'>,
  today: string,
): Warranty {
  const endDate = getWarrantyEndDate(purchase.purchaseDate, purchase.warrantyMonths);
  const remainingDays = getRemainingDays(endDate, today);

  return { endDate, remainingDays, status: getWarrantyStatus(remainingDays) };
}
