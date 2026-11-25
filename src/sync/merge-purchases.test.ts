import type { Purchase } from '@/purchases/purchase';

import {
  mergePurchases,
  UNKNOWN_CHANGE_DATE,
  type ChangeLog,
  type RemotePurchase,
} from './merge-purchases';

const MONDAY = '2026-11-23T10:00:00.000Z';
const TUESDAY = '2026-11-24T10:00:00.000Z';

function createPurchase(id: string, name = id): Purchase {
  return { id, name, purchaseDate: '2026-01-15', warrantyMonths: 24 };
}

function online(purchase: Purchase, changedAt: string, isDeleted = false): RemotePurchase {
  return { purchase, changedAt, isDeleted };
}

function merge(purchases: Purchase[], changes: ChangeLog, remotePurchases: RemotePurchase[]) {
  return mergePurchases({ purchases, changes }, remotePurchases);
}

describe('mergePurchases', () => {
  it('uploads a purchase that only exists on the phone', () => {
    const headphones = createPurchase('headphones');

    const result = merge([headphones], { headphones: { changedAt: MONDAY, isDeleted: false } }, []);

    expect(result.purchases).toEqual([headphones]);
    expect(result.toUpload).toEqual([online(headphones, MONDAY)]);
    expect(result.hasLocalChanges).toBe(false);
  });

  it('downloads a purchase that only exists online', () => {
    const headphones = createPurchase('headphones');

    const result = merge([], {}, [online(headphones, MONDAY)]);

    expect(result.purchases).toEqual([headphones]);
    expect(result.changes).toEqual({ headphones: { changedAt: MONDAY, isDeleted: false } });
    expect(result.toUpload).toEqual([]);
    expect(result.hasLocalChanges).toBe(true);
  });

  it('keeps the change of the phone when it is the most recent', () => {
    const renamed = createPurchase('headphones', 'Casque (téléphone)');
    const older = createPurchase('headphones', 'Casque (en ligne)');

    const result = merge([renamed], { headphones: { changedAt: TUESDAY, isDeleted: false } }, [
      online(older, MONDAY),
    ]);

    expect(result.purchases).toEqual([renamed]);
    expect(result.toUpload).toEqual([online(renamed, TUESDAY)]);
    expect(result.hasLocalChanges).toBe(false);
  });

  it('takes the online change when it is the most recent', () => {
    const older = createPurchase('headphones', 'Casque (téléphone)');
    const renamed = createPurchase('headphones', 'Casque (en ligne)');

    const result = merge([older], { headphones: { changedAt: MONDAY, isDeleted: false } }, [
      online(renamed, TUESDAY),
    ]);

    expect(result.purchases).toEqual([renamed]);
    expect(result.changes.headphones).toEqual({ changedAt: TUESDAY, isDeleted: false });
    expect(result.toUpload).toEqual([]);
    expect(result.hasLocalChanges).toBe(true);
  });

  it('does nothing when both copies changed at the same time', () => {
    const headphones = createPurchase('headphones');

    const result = merge([headphones], { headphones: { changedAt: MONDAY, isDeleted: false } }, [
      online(headphones, MONDAY),
    ]);

    expect(result.purchases).toEqual([headphones]);
    expect(result.toUpload).toEqual([]);
    expect(result.toDeleteOnline).toEqual([]);
    expect(result.hasLocalChanges).toBe(false);
  });

  it('treats a purchase without a known change as the oldest', () => {
    const demo = createPurchase('demo', 'Démonstration');
    const renamed = createPurchase('demo', 'Renommée ailleurs');

    const result = merge([demo], {}, [online(renamed, MONDAY)]);

    expect(result.purchases).toEqual([renamed]);
  });

  it('uploads a purchase without a known change with the oldest date', () => {
    const demo = createPurchase('demo');

    const result = merge([demo], {}, []);

    expect(result.toUpload).toEqual([online(demo, UNKNOWN_CHANGE_DATE)]);
  });

  it('deletes online a purchase deleted on the phone', () => {
    const headphones = createPurchase('headphones');

    const result = merge([], { headphones: { changedAt: TUESDAY, isDeleted: true } }, [
      online(headphones, MONDAY),
    ]);

    expect(result.purchases).toEqual([]);
    expect(result.toDeleteOnline).toEqual([{ id: 'headphones', changedAt: TUESDAY }]);
    expect(result.changes.headphones).toEqual({ changedAt: TUESDAY, isDeleted: true });
    expect(result.hasLocalChanges).toBe(false);
  });

  it('deletes on the phone a purchase deleted online', () => {
    const headphones = createPurchase('headphones');

    const result = merge([headphones], { headphones: { changedAt: MONDAY, isDeleted: false } }, [
      online(headphones, TUESDAY, true),
    ]);

    expect(result.purchases).toEqual([]);
    expect(result.changes.headphones).toEqual({ changedAt: TUESDAY, isDeleted: true });
    expect(result.toUpload).toEqual([]);
    expect(result.hasLocalChanges).toBe(true);
  });

  it('never brings back a demonstration purchase deleted on another phone', () => {
    const demo = createPurchase('demo');

    const result = merge([demo], {}, [online(demo, MONDAY, true)]);

    expect(result.purchases).toEqual([]);
  });

  it('brings a purchase back when it changed elsewhere after its deletion here', () => {
    const renamed = createPurchase('headphones', 'Renommé ailleurs');

    const result = merge([], { headphones: { changedAt: MONDAY, isDeleted: true } }, [
      online(renamed, TUESDAY),
    ]);

    expect(result.purchases).toEqual([renamed]);
    expect(result.toDeleteOnline).toEqual([]);
    expect(result.hasLocalChanges).toBe(true);
  });

  it('puts online again a purchase changed here after its deletion elsewhere', () => {
    const renamed = createPurchase('headphones', 'Renommé ici');

    const result = merge([renamed], { headphones: { changedAt: TUESDAY, isDeleted: false } }, [
      online(createPurchase('headphones'), MONDAY, true),
    ]);

    expect(result.purchases).toEqual([renamed]);
    expect(result.toUpload).toEqual([online(renamed, TUESDAY)]);
  });

  it('forgets the deletion of a purchase that was never sent online', () => {
    const result = merge([], { headphones: { changedAt: MONDAY, isDeleted: true } }, []);

    expect(result.changes).toEqual({});
    expect(result.toDeleteOnline).toEqual([]);
  });

  it('does not ask again to delete what is already deleted online', () => {
    const result = merge([], { headphones: { changedAt: TUESDAY, isDeleted: true } }, [
      online(createPurchase('headphones'), MONDAY, true),
    ]);

    expect(result.toDeleteOnline).toEqual([]);
    expect(result.purchases).toEqual([]);
  });

  it('ignores a purchase deleted online that the phone never had', () => {
    const result = merge([], {}, [online(createPurchase('headphones'), MONDAY, true)]);

    expect(result.purchases).toEqual([]);
    expect(result.hasLocalChanges).toBe(false);
  });

  it('compares dates written in different formats', () => {
    const older = createPurchase('headphones', 'Ancien');
    const renamed = createPurchase('headphones', 'Récent');

    // The online service writes '+00:00' where the phone writes 'Z'.
    const result = merge([older], { headphones: { changedAt: MONDAY, isDeleted: false } }, [
      online(renamed, '2026-11-24T10:00:00+00:00'),
    ]);

    expect(result.purchases).toEqual([renamed]);
  });

  it('keeps the order of the purchases of the phone and adds the new ones after', () => {
    const first = createPurchase('first');
    const second = createPurchase('second');
    const fromOnline = createPurchase('from-online');

    const result = merge([first, second], {}, [online(fromOnline, MONDAY)]);

    expect(result.purchases.map((purchase) => purchase.id)).toEqual([
      'first',
      'second',
      'from-online',
    ]);
  });
});
