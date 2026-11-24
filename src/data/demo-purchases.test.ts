import { groupPurchasesByWarrantyStatus } from '@/purchases/warranty-groups';

import { demoPurchases } from './demo-purchases';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIES = ['high-tech', 'home', 'kitchen', 'other'];

describe('demoPurchases', () => {
  it('contains several purchases with unique ids', () => {
    const ids = demoPurchases.map((purchase) => purchase.id);

    expect(demoPurchases.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(demoPurchases)('$name has the required fields', (purchase) => {
    expect(purchase.name.trim()).not.toBe('');
    expect(purchase.purchaseDate).toMatch(DATE_FORMAT);
    expect(Number.isInteger(purchase.warrantyMonths)).toBe(true);
    expect(purchase.warrantyMonths).toBeGreaterThan(0);
  });

  it.each(demoPurchases)('$name has valid optional fields', (purchase) => {
    if (purchase.price !== undefined) {
      expect(purchase.price).toBeGreaterThanOrEqual(0);
    }
    if (purchase.category !== undefined) {
      expect(CATEGORIES).toContain(purchase.category);
    }
  });

  it.each(['2026-11-26', '2026-11-27'])(
    'shows the three warranty statuses on %s, the days of the demonstration',
    (today) => {
      const groups = groupPurchasesByWarrantyStatus(demoPurchases, today);

      expect(groups.active.length).toBeGreaterThan(0);
      expect(groups.expiringSoon.length).toBeGreaterThan(0);
      expect(groups.expired.length).toBeGreaterThan(0);
    },
  );
});
