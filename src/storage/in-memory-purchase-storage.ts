import { createPurchaseId, type Purchase } from '@/purchases/purchase';

import type { PurchaseStorage } from './purchase-storage';

/**
 * Keeps the purchases in memory only: they are lost when the application restarts.
 * Used with the demonstration data until the persistent storage exists, and in tests.
 */
export function createInMemoryPurchaseStorage(initialPurchases: Purchase[]): PurchaseStorage {
  let purchases = [...initialPurchases];

  return {
    async getAll() {
      return purchases;
    },

    async add(input) {
      const purchase: Purchase = { ...input, id: createPurchaseId() };
      purchases = [purchase, ...purchases];
      return purchase;
    },

    async update(updatedPurchase) {
      purchases = purchases.map((purchase) =>
        purchase.id === updatedPurchase.id ? updatedPurchase : purchase,
      );
      return updatedPurchase;
    },

    async remove(id) {
      purchases = purchases.filter((purchase) => purchase.id !== id);
    },

    async replaceAll(newPurchases) {
      purchases = [...newPurchases];
    },
  };
}
