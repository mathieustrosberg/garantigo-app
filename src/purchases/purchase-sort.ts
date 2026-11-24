import type { Purchase } from './purchase';
import { getWarrantyEndDate } from './warranty';

export type PurchaseSortKey = 'purchaseDate' | 'warrantyEnd';

/**
 * Returns a sorted copy of the purchases:
 * - 'purchaseDate': the most recent purchase first;
 * - 'warrantyEnd': the warranty that ends first comes first.
 * Two purchases with the same date are ordered by name, so the order never changes by itself.
 */
export function sortPurchases(purchases: Purchase[], sortKey: PurchaseSortKey): Purchase[] {
  const compare = sortKey === 'purchaseDate' ? byMostRecentPurchase : byEarliestWarrantyEnd;
  return [...purchases].sort((first, second) => compare(first, second) || byName(first, second));
}

// 'YYYY-MM-DD' texts are in the same order as the days they describe.
function byMostRecentPurchase(first: Purchase, second: Purchase): number {
  return second.purchaseDate.localeCompare(first.purchaseDate);
}

function byEarliestWarrantyEnd(first: Purchase, second: Purchase): number {
  return getEndDate(first).localeCompare(getEndDate(second));
}

function getEndDate(purchase: Purchase): string {
  return getWarrantyEndDate(purchase.purchaseDate, purchase.warrantyMonths);
}

function byName(first: Purchase, second: Purchase): number {
  return first.name.localeCompare(second.name, 'fr');
}
