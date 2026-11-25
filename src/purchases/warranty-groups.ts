import type { Purchase } from './purchase';
import { getWarranty, type Warranty, type WarrantyStatus } from './warranty';

/** A purchase with its warranty, computed once for the screens. */
export type PurchaseWithWarranty = {
  purchase: Purchase;
  warranty: Warranty;
};

export type WarrantyGroups = Record<WarrantyStatus, PurchaseWithWarranty[]>;

/** Number of purchases in each warranty status. */
export type WarrantyCounts = Record<WarrantyStatus, number>;

/**
 * Sorts the purchases into the three warranty statuses.
 * Inside each group, the warranty closest to today comes first.
 * `today` is a parameter so that the result never depends on the real date.
 */
export function groupPurchasesByWarrantyStatus(
  purchases: Purchase[],
  today: string,
): WarrantyGroups {
  const groups: WarrantyGroups = { expiringSoon: [], active: [], expired: [] };

  for (const purchase of purchases) {
    const warranty = getWarranty(purchase, today);
    groups[warranty.status].push({ purchase, warranty });
  }

  // Still covered: the one that ends first is the most urgent.
  groups.expiringSoon.sort(byRemainingDays);
  groups.active.sort(byRemainingDays);
  // Expired: the most recently expired first.
  groups.expired.sort((first, second) => byRemainingDays(second, first));

  return groups;
}

/** Counts the purchases in each warranty status, for the summary above the list. */
export function countPurchasesByWarrantyStatus(
  purchases: Purchase[],
  today: string,
): WarrantyCounts {
  const counts: WarrantyCounts = { expiringSoon: 0, active: 0, expired: 0 };

  for (const purchase of purchases) {
    counts[getWarranty(purchase, today).status] += 1;
  }

  return counts;
}

function byRemainingDays(first: PurchaseWithWarranty, second: PurchaseWithWarranty): number {
  return first.warranty.remainingDays - second.warranty.remainingDays;
}
