import type { Purchase, PurchaseInput } from '@/purchases/purchase';

import { createInMemoryPurchaseStorage } from './in-memory-purchase-storage';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

const kettleInput: PurchaseInput = {
  name: 'Bouilloire',
  purchaseDate: '2026-10-02',
  warrantyMonths: 12,
  price: 39.9,
};

describe('createInMemoryPurchaseStorage', () => {
  it('returns the initial purchases', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);

    expect(await storage.getAll()).toEqual([headphones]);
  });

  it('adds a purchase with a new id, at the top of the list', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);

    const kettle = await storage.add(kettleInput);

    expect(kettle).toEqual({ ...kettleInput, id: expect.any(String) });
    expect(kettle.id).not.toBe(headphones.id);
    expect(await storage.getAll()).toEqual([kettle, headphones]);
  });

  it('updates the purchase that has the same id', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);
    const renamed: Purchase = { ...headphones, name: 'Casque sans fil' };

    await storage.update(renamed);

    expect(await storage.getAll()).toEqual([renamed]);
  });

  it('removes a purchase by id', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);

    await storage.remove(headphones.id);

    expect(await storage.getAll()).toEqual([]);
  });

  it('does not change the list given at creation', async () => {
    const initialPurchases = [headphones];
    const storage = createInMemoryPurchaseStorage(initialPurchases);

    await storage.add(kettleInput);

    expect(initialPurchases).toEqual([headphones]);
  });

  it('leaves the list unchanged when the updated purchase is unknown', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);

    await storage.update({ ...headphones, id: 'unknown', name: 'Inconnu' });

    expect(await storage.getAll()).toEqual([headphones]);
  });

  it('leaves the list unchanged when the removed purchase is unknown', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);

    await storage.remove('unknown');

    expect(await storage.getAll()).toEqual([headphones]);
  });
});
