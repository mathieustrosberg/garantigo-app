import type { PurchaseInput } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';

import { createInMemoryChangeLogStore } from './change-log-store';
import { createInMemoryOwnerStore } from './owner-store';
import { createTrackedPurchaseStorage } from './tracked-purchase-storage';

const NOW = '2026-11-24T10:00:00.000Z';

const kettleInput: PurchaseInput = {
  name: 'Bouilloire',
  purchaseDate: '2026-05-02',
  warrantyMonths: 24,
};

function createStorage() {
  const changeLog = createInMemoryChangeLogStore();
  const storage = createTrackedPurchaseStorage(
    createInMemoryPurchaseStorage([]),
    changeLog,
    createInMemoryOwnerStore(),
    { getNow: () => NOW },
  );
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

    await storage.mergeWithRemote(
      [
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
      ],
      'account-1',
    );

    expect(listener).not.toHaveBeenCalled();
    expect((await storage.getAll()).map((purchase) => purchase.name)).toEqual(['Grille-pain']);
  });

  it('loses no purchase added while a merge is being saved', async () => {
    const { storage } = createStorage();

    // Both start at the same time: the queue runs them one after the other.
    const [, kettle] = await Promise.all([
      storage.mergeWithRemote([], 'account-1'),
      storage.add(kettleInput),
    ]);

    expect(await storage.getAll()).toEqual([kettle]);
  });

  it('keeps working after a change that failed', async () => {
    const { storage } = createStorage();

    await expect(storage.mergeWithRemote(null as never, 'account-1')).rejects.toThrow();
    const kettle = await storage.add(kettleInput);

    expect(await storage.getAll()).toEqual([kettle]);
  });

  describe('emptyCopyOfAnotherAccount', () => {
    const toaster = {
      id: 'toaster',
      name: 'Grille-pain',
      purchaseDate: '2026-03-01',
      warrantyMonths: 24,
      receiptFileName: 'receipt-1.jpg',
    };

    /** A phone that holds the toaster of `owner`, or of nobody yet when `owner` is null. */
    function createPhoneOf(owner: string | null) {
      const changeLog = createInMemoryChangeLogStore({
        toaster: { changedAt: NOW, isDeleted: false },
      });
      const deletePhoto = jest.fn();
      const storage = createTrackedPurchaseStorage(
        createInMemoryPurchaseStorage([toaster]),
        changeLog,
        createInMemoryOwnerStore(owner),
        { getNow: () => NOW, deletePhoto },
      );
      return { storage, changeLog, deletePhoto };
    }

    it('empties the purchases, the change log and the photos of another account', async () => {
      const { storage, changeLog, deletePhoto } = createPhoneOf('account-1');

      const wasEmptied = await storage.emptyCopyOfAnotherAccount('account-2');

      expect(wasEmptied).toBe(true);
      expect(await storage.getAll()).toEqual([]);
      expect(await changeLog.read()).toEqual({});
      expect(deletePhoto).toHaveBeenCalledWith('receipt-1.jpg');
    });

    it('keeps the copy of the account that signs in again', async () => {
      const { storage, deletePhoto } = createPhoneOf('account-1');

      const wasEmptied = await storage.emptyCopyOfAnotherAccount('account-1');

      expect(wasEmptied).toBe(false);
      expect(await storage.getAll()).toEqual([toaster]);
      expect(deletePhoto).not.toHaveBeenCalled();
    });

    it('keeps the purchases made before the very first sign-in', async () => {
      const { storage } = createPhoneOf(null);

      const wasEmptied = await storage.emptyCopyOfAnotherAccount('account-1');

      expect(wasEmptied).toBe(false);
      expect(await storage.getAll()).toEqual([toaster]);
    });

    it('gives the phone to the new account: what it adds offline survives the next merge', async () => {
      const { storage } = createPhoneOf('account-1');
      await storage.emptyCopyOfAnotherAccount('account-2');
      const kettle = await storage.add(kettleInput);

      const result = await storage.mergeWithRemote([], 'account-2');

      expect(await storage.getAll()).toEqual([kettle]);
      expect(result.toUpload.map((remote) => remote.purchase)).toEqual([kettle]);
    });

    it('tells no listener: emptying the copy is not a change made by the user', async () => {
      const { storage } = createPhoneOf('account-1');
      const listener = jest.fn();
      storage.onLocalChange(listener);

      await storage.emptyCopyOfAnotherAccount('account-2');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('receipt photos left without purchase by a merge', () => {
    const toaster = {
      id: 'toaster',
      name: 'Grille-pain',
      purchaseDate: '2026-03-01',
      warrantyMonths: 24,
      receiptFileName: 'receipt-1.jpg',
    };

    function createStorageWithToaster() {
      const deletePhoto = jest.fn();
      const storage = createTrackedPurchaseStorage(
        createInMemoryPurchaseStorage([toaster]),
        createInMemoryChangeLogStore(),
        createInMemoryOwnerStore(),
        { getNow: () => NOW, deletePhoto },
      );
      return { storage, deletePhoto };
    }

    it('are deleted when their purchase was deleted on another phone', async () => {
      const { storage, deletePhoto } = createStorageWithToaster();

      await storage.mergeWithRemote(
        [{ purchase: toaster, changedAt: NOW, isDeleted: true }],
        'account-1',
      );

      expect(deletePhoto).toHaveBeenCalledWith('receipt-1.jpg');
    });

    it('are deleted when their photo was replaced on another phone', async () => {
      const { storage, deletePhoto } = createStorageWithToaster();

      await storage.mergeWithRemote(
        [
          {
            purchase: { ...toaster, receiptFileName: 'receipt-2.jpg' },
            changedAt: NOW,
            isDeleted: false,
          },
        ],
        'account-1',
      );

      expect(deletePhoto).toHaveBeenCalledWith('receipt-1.jpg');
    });

    it('are deleted when another account takes the phone', async () => {
      const { storage, deletePhoto } = createStorageWithToaster();
      await storage.mergeWithRemote([], 'account-1');

      await storage.mergeWithRemote([], 'account-2');

      expect(deletePhoto).toHaveBeenCalledWith('receipt-1.jpg');
    });

    it('are kept as long as their purchase stays', async () => {
      const { storage, deletePhoto } = createStorageWithToaster();

      await storage.mergeWithRemote([], 'account-1');

      expect(deletePhoto).not.toHaveBeenCalled();
    });
  });
});
