import type { Purchase } from '@/purchases/purchase';
import type { PurchaseStorage } from '@/storage/purchase-storage';

import type { ChangeLogStore } from './change-log-store';
import { mergePurchases, type MergeResult, type RemotePurchase } from './merge-purchases';
import type { OwnerStore } from './owner-store';

/** A purchase storage that remembers when each purchase changed, so it can be synchronised. */
export interface TrackedPurchaseStorage extends PurchaseStorage {
  /**
   * Merges the online purchases of an account into the phone copy and saves the result
   * on the phone. Returns what must then be sent online.
   *
   * The phone copy belongs to one account. When another account signs in, the copy is
   * emptied first: nobody receives the purchases of someone else.
   */
  mergeWithRemote(remotePurchases: RemotePurchase[], accountId: string): Promise<MergeResult>;
  /** Calls `listener` after each purchase added, changed or removed on this phone. */
  onLocalChange(listener: () => void): () => void;
}

type Options = {
  /** Current date and time. A parameter so that tests never depend on the real clock. */
  getNow?: () => string;
  /**
   * Deletes a receipt photo from the phone. Called for the photos that a merge leaves
   * without purchase: their purchase was deleted on another phone, or belongs to another account.
   */
  deletePhoto?: (fileName: string) => void;
};

/**
 * Wraps a purchase storage: every change is done as before, then its date is written
 * in the change log. The screens see no difference.
 */
export function createTrackedPurchaseStorage(
  storage: PurchaseStorage,
  changeLog: ChangeLogStore,
  ownerStore: OwnerStore,
  { getNow = () => new Date().toISOString(), deletePhoto = () => {} }: Options = {},
): TrackedPurchaseStorage {
  const runAlone = createQueue();
  const listeners = new Set<() => void>();

  async function recordChange(id: string, isDeleted: boolean) {
    const changes = await changeLog.read();
    await changeLog.write({ ...changes, [id]: { changedAt: getNow(), isDeleted } });
  }

  /** Runs a change of the phone copy alone, then tells the listeners. */
  async function change<Result>(task: () => Promise<Result>): Promise<Result> {
    const result = await runAlone(task);
    listeners.forEach((listener) => listener());
    return result;
  }

  return {
    getAll: () => storage.getAll(),

    add: (input) =>
      change(async () => {
        const purchase = await storage.add(input);
        await recordChange(purchase.id, false);
        return purchase;
      }),

    update: (purchase) =>
      change(async () => {
        const updatedPurchase = await storage.update(purchase);
        await recordChange(purchase.id, false);
        return updatedPurchase;
      }),

    remove: (id) =>
      change(async () => {
        await storage.remove(id);
        await recordChange(id, true);
      }),

    replaceAll: (purchases) => runAlone(() => storage.replaceAll(purchases)),

    // Not a change made by the user: the listeners are not told, or it would never stop.
    mergeWithRemote: (remotePurchases, accountId) =>
      runAlone(async () => {
        const owner = await ownerStore.read();
        // No owner yet: the purchases made before the first sign-in go to this account.
        const belongsToAnotherAccount = owner !== null && owner !== accountId;

        const purchasesBefore = await storage.getAll();
        const local = belongsToAnotherAccount
          ? { purchases: [], changes: {} }
          : { purchases: purchasesBefore, changes: await changeLog.read() };
        const result = mergePurchases(local, remotePurchases);
        if (belongsToAnotherAccount) result.hasLocalChanges = true;

        if (result.hasLocalChanges) await storage.replaceAll(result.purchases);
        await changeLog.write(result.changes);
        if (owner !== accountId) await ownerStore.write(accountId);

        // Only once everything is saved: a failed save keeps the photos.
        for (const fileName of getPhotosLeftWithoutPurchase(purchasesBefore, result.purchases)) {
          deletePhoto(fileName);
        }
        return result;
      }),

    onLocalChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** File names of the photos that a purchase named before, and that no purchase names now. */
function getPhotosLeftWithoutPurchase(before: Purchase[], after: Purchase[]): string[] {
  const namesAfter = new Set(after.map((purchase) => purchase.receiptFileName));

  return before
    .map((purchase) => purchase.receiptFileName)
    .filter((fileName) => fileName !== undefined)
    .filter((fileName) => !namesAfter.has(fileName));
}

/**
 * Runs the tasks one after the other, in the order they are given.
 * Without it, a purchase added while a merge is being saved could be lost.
 */
function createQueue() {
  let lastTask: Promise<unknown> = Promise.resolve();

  return function runAlone<Result>(task: () => Promise<Result>): Promise<Result> {
    const result = lastTask.then(task, task);
    // A failed task must not block the next ones.
    lastTask = result.catch(() => undefined);
    return result;
  };
}
