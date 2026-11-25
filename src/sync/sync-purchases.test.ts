import type { Purchase, PurchaseInput } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';

import { createInMemoryChangeLogStore } from './change-log-store';
import { createInMemoryRemotePurchases, type RemotePurchases } from './remote-purchases';
import { syncPurchases } from './sync-purchases';
import { createTrackedPurchaseStorage } from './tracked-purchase-storage';

const kettleInput: PurchaseInput = {
  name: 'Bouilloire',
  purchaseDate: '2026-05-02',
  warrantyMonths: 24,
};

const demoHeadphones: Purchase = {
  id: 'demo-headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

/** A clock moved by hand: each change of the test happens one minute after the previous one. */
function createClock() {
  let minutes = 0;
  return () => new Date(Date.UTC(2026, 10, 24, 10, minutes++)).toISOString();
}

/** A phone with its own storage. Several phones can share the same clock and the same account. */
function createPhone(getNow: () => string, firstLaunchPurchases: Purchase[] = []) {
  return createTrackedPurchaseStorage(
    createInMemoryPurchaseStorage(firstLaunchPurchases),
    createInMemoryChangeLogStore(),
    { getNow },
  );
}

async function getNames(phone: { getAll(): Promise<Purchase[]> }) {
  return (await phone.getAll()).map((purchase) => purchase.name).sort();
}

describe('syncPurchases, with two phones on the same account', () => {
  let account: RemotePurchases;
  let getNow: () => string;

  beforeEach(() => {
    account = createInMemoryRemotePurchases();
    getNow = createClock();
  });

  it('brings a purchase added on one phone to the other', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    await oldPhone.add(kettleInput);

    await syncPurchases(oldPhone, account);
    const hasChanged = await syncPurchases(newPhone, account);

    expect(await getNames(newPhone)).toEqual(['Bouilloire']);
    expect(hasChanged).toBe(true);
  });

  it('says that nothing changed on the phone that only sent its purchases', async () => {
    const phone = createPhone(getNow);
    await phone.add(kettleInput);

    expect(await syncPurchases(phone, account)).toBe(false);
  });

  it('brings a change made on one phone to the other', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    const kettle = await oldPhone.add(kettleInput);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    await newPhone.update({ ...kettle, name: 'Bouilloire inox', price: 39.9 });
    await syncPurchases(newPhone, account);
    await syncPurchases(oldPhone, account);

    expect(await oldPhone.getAll()).toEqual([{ ...kettle, name: 'Bouilloire inox', price: 39.9 }]);
  });

  it('deletes on the other phone a purchase deleted on one phone', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    const kettle = await oldPhone.add(kettleInput);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    await oldPhone.remove(kettle.id);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    expect(await newPhone.getAll()).toEqual([]);
  });

  it('never brings a deleted purchase back, however many times the phones synchronise', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    const kettle = await oldPhone.add(kettleInput);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);
    await newPhone.remove(kettle.id);

    for (let round = 0; round < 3; round++) {
      await syncPurchases(newPhone, account);
      await syncPurchases(oldPhone, account);
    }

    expect(await oldPhone.getAll()).toEqual([]);
    expect(await newPhone.getAll()).toEqual([]);
  });

  it('keeps the most recent change when both phones changed the same purchase', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    const kettle = await oldPhone.add(kettleInput);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    // Both phones are offline: the old one changes the purchase first, the new one after.
    await oldPhone.update({ ...kettle, name: 'Changée en premier' });
    await newPhone.update({ ...kettle, name: 'Changée en dernier' });
    await syncPurchases(newPhone, account);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    expect(await getNames(oldPhone)).toEqual(['Changée en dernier']);
    expect(await getNames(newPhone)).toEqual(['Changée en dernier']);
  });

  it('keeps the purchases added on each phone while offline', async () => {
    const oldPhone = createPhone(getNow);
    const newPhone = createPhone(getNow);
    await oldPhone.add({ ...kettleInput, name: 'Ajouté sur l’ancien' });
    await newPhone.add({ ...kettleInput, name: 'Ajouté sur le nouveau' });

    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);
    await syncPurchases(oldPhone, account);

    const expectedNames = ['Ajouté sur le nouveau', 'Ajouté sur l’ancien'];
    expect(await getNames(oldPhone)).toEqual(expectedNames);
    expect(await getNames(newPhone)).toEqual(expectedNames);
  });

  it('does not duplicate the demonstration purchases of a new phone', async () => {
    const oldPhone = createPhone(getNow, [demoHeadphones]);
    const newPhone = createPhone(getNow, [demoHeadphones]);

    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);

    expect(await newPhone.getAll()).toEqual([demoHeadphones]);
  });

  it('does not bring back on a new phone a demonstration purchase deleted before', async () => {
    const oldPhone = createPhone(getNow, [demoHeadphones]);
    await syncPurchases(oldPhone, account);
    await oldPhone.remove(demoHeadphones.id);
    await syncPurchases(oldPhone, account);

    // The new phone starts with the demonstration purchases, like any first launch.
    const newPhone = createPhone(getNow, [demoHeadphones]);
    await syncPurchases(newPhone, account);

    expect(await newPhone.getAll()).toEqual([]);
  });
});

describe('syncPurchases, when the network fails', () => {
  it('changes nothing on the phone when the online copy cannot be read', async () => {
    const phone = createPhone(createClock());
    const kettle = await phone.add(kettleInput);
    const account: RemotePurchases = {
      ...createInMemoryRemotePurchases(),
      fetchAll: () => Promise.reject(new Error('offline')),
    };

    await expect(syncPurchases(phone, account)).rejects.toThrow('offline');
    expect(await phone.getAll()).toEqual([kettle]);
  });

  it('sends later what could not be sent', async () => {
    const getNow = createClock();
    const phone = createPhone(getNow);
    const otherPhone = createPhone(getNow);
    const account = createInMemoryRemotePurchases();
    await phone.add(kettleInput);

    const brokenAccount = { ...account, upload: () => Promise.reject(new Error('offline')) };
    await expect(syncPurchases(phone, brokenAccount)).rejects.toThrow('offline');

    // The network is back.
    await syncPurchases(phone, account);
    await syncPurchases(otherPhone, account);

    expect(await getNames(otherPhone)).toEqual(['Bouilloire']);
  });
});
