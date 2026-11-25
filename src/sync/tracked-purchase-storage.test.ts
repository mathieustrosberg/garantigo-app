import type { PurchaseInput } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';

import { createInMemoryChangeLogStore } from './change-log-store';
import { createTrackedPurchaseStorage } from './tracked-purchase-storage';

const NOW = '2026-11-24T10:00:00.000Z';

const kettleInput: PurchaseInput = {
  name: 'Bouilloire',
  purchaseDate: '2026-05-02',
  warrantyMonths: 24,
};

function createStorage() {
  const changeLog = createInMemoryChangeLogStore();
  const storage = createTrackedPurchaseStorage(createInMemoryPurchaseStorage([]), changeLog, {
    getNow: () => NOW,
  });
  return { storage, changeLog };
}

describe('createTrackedPurchaseStorage', () => {
  it('adds, changes and removes purchases like the storage it wraps', async () => {
    const { storage } = createStorage();

    const kettle = await storage.add(kettleInput);
    await storage.update({ ...kettle, name: 'Bouilloire inox' });
    expect(await storage.getAll()).toEqual([{ ...kettle, name: 'Bouilloire inox' }]);

    await storage.remove(kettle.id);
    expect(await storage.getAll()).toEqual([]);
  });

  it('writes the date of an added purchase in the change log', async () => {
    const { storage, changeLog } = createStorage();

    const kettle = await storage.add(kettleInput);

    expect(await changeLog.read()).toEqual({ [kettle.id]: { changedAt: NOW, isDeleted: false } });
  });

  it('remembers a removed purchase as deleted', async () => {
    const { storage, changeLog } = createStorage();
    const kettle = await storage.add(kettleInput);

    await storage.remove(kettle.id);

    expect(await changeLog.read()).toEqual({ [kettle.id]: { changedAt: NOW, isDeleted: true } });
  });

  it('tells its listeners after each change made on the phone', async () => {
    const { storage } = createStorage();
    const listener = jest.fn();
    storage.onLocalChange(listener);

    const kettle = await storage.add(kettleInput);
    await storage.update(kettle);
    await storage.remove(kettle.id);

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('stops telling a listener that left', async () => {
    const { storage } = createStorage();
    const listener = jest.fn();
    const stopListening = storage.onLocalChange(listener);

    stopListening();
    await storage.add(kettleInput);

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not tell its listeners when the change comes from the online copy', async () => {
    const { storage } = createStorage();
    const listener = jest.fn();
    storage.onLocalChange(listener);

    await storage.mergeWithRemote([
      {
        purchase: {
          id: 'toaster',
          name: 'Grille-pain',
          purchaseDate: '2026-03-01',
          warrantyMonths: 24,
        },
        changedAt: NOW,
        isDeleted: false,
      },
    ]);

    expect(listener).not.toHaveBeenCalled();
    expect((await storage.getAll()).map((purchase) => purchase.name)).toEqual(['Grille-pain']);
  });

  it('loses no purchase added while a merge is being saved', async () => {
    const { storage } = createStorage();

    // Both start at the same time: the queue runs them one after the other.
    const [, kettle] = await Promise.all([storage.mergeWithRemote([]), storage.add(kettleInput)]);

    expect(await storage.getAll()).toEqual([kettle]);
  });

  it('keeps working after a change that failed', async () => {
    const { storage } = createStorage();

    await expect(storage.mergeWithRemote(null as never)).rejects.toThrow();
    const kettle = await storage.add(kettleInput);

    expect(await storage.getAll()).toEqual([kettle]);
  });
});
