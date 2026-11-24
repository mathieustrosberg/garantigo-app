import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Purchase, PurchaseInput } from '@/purchases/purchase';

import { createAsyncPurchaseStorage, PURCHASES_STORAGE_KEY } from './async-purchase-storage';
import { StorageError } from './purchase-storage';

const demoHeadphones: Purchase = {
  id: 'demo-headphones',
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

/** A new storage object reads the phone again, exactly like the application after a restart. */
function restartApplication() {
  return createAsyncPurchaseStorage([demoHeadphones]);
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('demonstration purchases', () => {
  it('are loaded and saved on the very first launch', async () => {
    const storage = restartApplication();

    expect(await storage.getAll()).toEqual([demoHeadphones]);
    expect(await AsyncStorage.getItem(PURCHASES_STORAGE_KEY)).toBe(
      JSON.stringify([demoHeadphones]),
    );
  });

  it('never replace the purchases of the user', async () => {
    const kettle = await restartApplication().add(kettleInput);
    await restartApplication().remove(demoHeadphones.id);

    expect(await restartApplication().getAll()).toEqual([kettle]);
  });

  it('do not come back after the user removed every purchase', async () => {
    await restartApplication().remove(demoHeadphones.id);

    expect(await restartApplication().getAll()).toEqual([]);
  });
});

describe('persistence after a restart', () => {
  it('keeps an added purchase', async () => {
    const kettle = await restartApplication().add(kettleInput);

    expect(kettle).toEqual({ ...kettleInput, id: expect.any(String) });
    expect(await restartApplication().getAll()).toEqual([kettle, demoHeadphones]);
  });

  it('keeps an updated purchase', async () => {
    const renamed: Purchase = { ...demoHeadphones, name: 'Casque sans fil' };

    await restartApplication().update(renamed);

    expect(await restartApplication().getAll()).toEqual([renamed]);
  });

  it('keeps a removal', async () => {
    const kettle = await restartApplication().add(kettleInput);

    await restartApplication().remove(kettle.id);

    expect(await restartApplication().getAll()).toEqual([demoHeadphones]);
  });
});

describe('unknown purchases', () => {
  it('leaves the saved list unchanged when the updated purchase is unknown', async () => {
    await restartApplication().update({ ...demoHeadphones, id: 'unknown', name: 'Inconnu' });

    expect(await restartApplication().getAll()).toEqual([demoHeadphones]);
  });

  it('leaves the saved list unchanged when the removed purchase is unknown', async () => {
    await restartApplication().remove('unknown');

    expect(await restartApplication().getAll()).toEqual([demoHeadphones]);
  });

  it('keeps the other purchases when one is updated', async () => {
    const kettle = await restartApplication().add(kettleInput);
    const renamed: Purchase = { ...demoHeadphones, name: 'Casque sans fil' };

    await restartApplication().update(renamed);

    expect(await restartApplication().getAll()).toEqual([kettle, renamed]);
  });
});

describe('storage errors', () => {
  it('reports a read error when the phone storage cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk unavailable'));

    const error = await restartApplication()
      .getAll()
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StorageError);
    expect((error as StorageError).operation).toBe('read');
  });

  it('reports a read error when the saved data is not valid JSON', async () => {
    await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, '{ broken');

    await expect(restartApplication().getAll()).rejects.toMatchObject({ operation: 'read' });
  });

  it('reports a read error when the saved data is not a list', async () => {
    await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, '{"name":"Casque audio"}');

    await expect(restartApplication().getAll()).rejects.toMatchObject({ operation: 'read' });
  });

  it('reports a write error when a purchase cannot be saved', async () => {
    const storage = restartApplication();
    await storage.getAll();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(storage.add(kettleInput)).rejects.toMatchObject({ operation: 'write' });
  });

  it('leaves the saved purchases untouched after a write error', async () => {
    const storage = restartApplication();
    await storage.getAll();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await storage.add(kettleInput).catch(() => {});

    expect(await restartApplication().getAll()).toEqual([demoHeadphones]);
  });
});
