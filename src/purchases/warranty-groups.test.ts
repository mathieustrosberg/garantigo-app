import type { Purchase } from './purchase';
import { groupPurchasesByWarrantyStatus } from './warranty-groups';

const TODAY = '2026-11-24';

function createPurchase(name: string, purchaseDate: string, warrantyMonths = 24): Purchase {
  return { id: name, name, purchaseDate, warrantyMonths };
}

function getNames(purchases: Purchase[]) {
  const groups = groupPurchasesByWarrantyStatus(purchases, TODAY);
  return {
    expiringSoon: groups.expiringSoon.map((item) => item.purchase.name),
    active: groups.active.map((item) => item.purchase.name),
    expired: groups.expired.map((item) => item.purchase.name),
  };
}

describe('groupPurchasesByWarrantyStatus', () => {
  it('returns three empty groups when there is no purchase', () => {
    expect(groupPurchasesByWarrantyStatus([], TODAY)).toEqual({
      expiringSoon: [],
      active: [],
      expired: [],
    });
  });

  it('puts each purchase in the group of its warranty status', () => {
    const names = getNames([
      createPurchase('Casque', '2026-11-18'),
      createPurchase('Machine à café', '2024-12-12'),
      createPurchase('Aspirateur', '2023-04-10'),
    ]);

    expect(names).toEqual({
      expiringSoon: ['Machine à café'],
      active: ['Casque'],
      expired: ['Aspirateur'],
    });
  });

  it('respects the exact 30-day threshold', () => {
    const names = getNames([
      createPurchase('31 jours', '2024-12-25'),
      createPurchase('30 jours', '2024-12-24'),
      createPurchase('Dernier jour', '2024-11-24'),
      createPurchase('Hier', '2024-11-23'),
    ]);

    expect(names).toEqual({
      expiringSoon: ['Dernier jour', '30 jours'],
      active: ['31 jours'],
      expired: ['Hier'],
    });
  });

  it('gives the warranty of each purchase', () => {
    const groups = groupPurchasesByWarrantyStatus([createPurchase('Casque', '2026-11-18')], TODAY);

    expect(groups.active[0].warranty).toEqual({
      endDate: '2028-11-18',
      remainingDays: 725,
      status: 'active',
    });
  });

  it('shows first the active warranty that ends first', () => {
    const names = getNames([
      createPurchase('Dans 2 ans', '2026-11-18'),
      createPurchase('Dans 6 mois', '2025-05-21'),
      createPurchase('Dans 15 mois', '2026-03-01'),
    ]);

    expect(names.active).toEqual(['Dans 6 mois', 'Dans 15 mois', 'Dans 2 ans']);
  });

  it('shows first the warranty that expired most recently', () => {
    const names = getNames([
      createPurchase('Il y a 3 ans', '2021-11-01'),
      createPurchase('Il y a 1 mois', '2024-10-20'),
      createPurchase('Il y a 1 an', '2023-11-10'),
    ]);

    expect(names.expired).toEqual(['Il y a 1 mois', 'Il y a 1 an', 'Il y a 3 ans']);
  });

  it('does not change the list it receives', () => {
    const purchases = [createPurchase('B', '2026-11-18'), createPurchase('A', '2025-05-21')];

    groupPurchasesByWarrantyStatus(purchases, TODAY);

    expect(purchases.map((purchase) => purchase.name)).toEqual(['B', 'A']);
  });
});
