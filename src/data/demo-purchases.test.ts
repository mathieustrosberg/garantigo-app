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
});
