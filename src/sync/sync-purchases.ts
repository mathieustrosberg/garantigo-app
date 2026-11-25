import type { RemotePurchases } from './remote-purchases';
import type { TrackedPurchaseStorage } from './tracked-purchase-storage';

/**
 * Brings the phone and the online copy of an account to the same purchases.
 * Returns true when the purchases of the phone changed: the screens must read them again.
 *
 * The phone copy is saved before anything is sent: if the network drops in the middle,
 * nothing is lost and the next synchronisation sends what is still missing.
 */
export async function syncPurchases(
  storage: TrackedPurchaseStorage,
  remote: RemotePurchases,
): Promise<boolean> {
  const remotePurchases = await remote.fetchAll();
  const result = await storage.mergeWithRemote(remotePurchases);

  await remote.upload(result.toUpload);
  await remote.markDeleted(result.toDeleteOnline);

  return result.hasLocalChanges;
}
