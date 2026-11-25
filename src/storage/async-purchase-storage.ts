import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteReceiptPhoto } from '@/native/receipt-photos';
import { createPurchaseId, type Purchase } from '@/purchases/purchase';

import { StorageError, type PurchaseStorage } from './purchase-storage';

// The version suffix lets a future data format use a new key without breaking this one.
export const PURCHASES_STORAGE_KEY = 'garantigo.purchases.v1';

/**
 * Keeps the purchases on the phone, so they survive when the application restarts.
 * `firstLaunchPurchases` is only written when nothing has ever been saved.
 */
export function createAsyncPurchaseStorage(firstLaunchPurchases: Purchase[]): PurchaseStorage {
  async function getAll() {
    const savedValue = await readSavedValue();

    // null means "never saved": an empty list saved by the user is '[]', not null.
    if (savedValue === null) {
      await save(firstLaunchPurchases);
      return firstLaunchPurchases;
    }

    return parsePurchases(savedValue);
  }

  return {
    getAll,

    async add(input) {
      const purchase: Purchase = { ...input, id: createPurchaseId() };
      await save([purchase, ...(await getAll())]);
      return purchase;
    },

    async update(updatedPurchase) {
      const purchases = await getAll();
      await save(
        purchases.map((purchase) =>
          purchase.id === updatedPurchase.id ? updatedPurchase : purchase,
        ),
      );
      return updatedPurchase;
    },

    async remove(id) {
      const purchases = await getAll();
      const removedPurchase = purchases.find((purchase) => purchase.id === id);
      await save(purchases.filter((purchase) => purchase.id !== id));

      // The photo is deleted only once the list is saved: a failed save keeps both.
      if (removedPurchase?.receiptFileName !== undefined) {
        deleteReceiptPhoto(removedPurchase.receiptFileName);
      }
    },

    replaceAll: save,
  };
}

async function readSavedValue(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PURCHASES_STORAGE_KEY);
  } catch {
    throw new StorageError('read');
  }
}

function parsePurchases(savedValue: string): Purchase[] {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(savedValue);
  } catch {
    throw new StorageError('read');
  }

  if (!Array.isArray(parsedValue)) {
    throw new StorageError('read');
  }
  return parsedValue as Purchase[];
}

async function save(purchases: Purchase[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
  } catch {
    throw new StorageError('write');
  }
}
