import type { Purchase } from './purchase';
import { sortPurchases } from './purchase-sort';

function createPurchase(name: string, purchaseDate: string, warrantyMonths: number): Purchase {
  return { id: name, name, purchaseDate, warrantyMonths };
}

// Bought last, but with the shortest warranty: the two sort orders differ.
const kettle = createPurchase('Bouilloire', '2026-10-02', 6);
const headphones = createPurchase('Casque', '2026-03-01', 24);
const laptop = createPurchase('Ordinateur', '2025-05-21', 36);

function getNames(purchases: Purchase[]): string[] {
  return purchases.map((purchase) => purchase.name);
}

describe('sortPurchases by purchase date', () => {
  it('puts the most recent purchase first', () => {
    const sorted = sortPurchases([laptop, kettle, headphones], 'purchaseDate');

    expect(getNames(sorted)).toEqual(['Bouilloire', 'Casque', 'Ordinateur']);
  });

  it('orders by name the purchases made on the same day', () => {
    const sameDay = [
      createPurchase('Souris', '2026-11-18', 24),
      createPurchase('Écran', '2026-11-18', 24),
      createPurchase('Clavier', '2026-11-18', 24),
    ];

    expect(getNames(sortPurchases(sameDay, 'purchaseDate'))).toEqual([
      'Clavier',
      'Écran',
      'Souris',
    ]);
  });
});

describe('sortPurchases by warranty end', () => {
  it('puts first the warranty that ends first', () => {
    // Bouilloire: 2027-04-02, Casque: 2028-03-01, Ordinateur: 2028-05-21.
    const sorted = sortPurchases([laptop, headphones, kettle], 'warrantyEnd');

    expect(getNames(sorted)).toEqual(['Bouilloire', 'Casque', 'Ordinateur']);
  });

  it('uses the end of the warranty, not the purchase date', () => {
    const boughtFirstLongWarranty = createPurchase('Lave-linge', '2024-01-10', 60);
    const boughtLastShortWarranty = createPurchase('Lampe', '2026-06-01', 12);

    const sorted = sortPurchases([boughtFirstLongWarranty, boughtLastShortWarranty], 'warrantyEnd');

    expect(getNames(sorted)).toEqual(['Lampe', 'Lave-linge']);
  });

  it('orders by name the warranties that end on the same day', () => {
    const sameEnd = [
      createPurchase('Tablette', '2026-11-18', 12),
      createPurchase('Imprimante', '2025-11-18', 24),
    ];

    expect(getNames(sortPurchases(sameEnd, 'warrantyEnd'))).toEqual(['Imprimante', 'Tablette']);
  });
});

describe('sortPurchases', () => {
  it('does not change the list it receives', () => {
    const purchases = [laptop, kettle, headphones];

    sortPurchases(purchases, 'purchaseDate');

    expect(getNames(purchases)).toEqual(['Ordinateur', 'Bouilloire', 'Casque']);
  });

  it('returns an empty list for an empty list', () => {
    expect(sortPurchases([], 'warrantyEnd')).toEqual([]);
  });
});
