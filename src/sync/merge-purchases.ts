import type { Purchase } from '@/purchases/purchase';

/** When a purchase last changed on a phone, and whether that change was its deletion. */
export type Change = {
  /** Date and time of the change, as given by `new Date().toISOString()`. */
  changedAt: string;
  isDeleted: boolean;
};

/** The last change of each purchase, by purchase id. Deleted purchases stay in it. */
export type ChangeLog = Record<string, Change>;

/** A purchase as kept online: its content and its last change. */
export type RemotePurchase = Change & {
  purchase: Purchase;
};

/** What the phone knows: its purchases and when each of them last changed. */
export type LocalCopy = {
  purchases: Purchase[];
  changes: ChangeLog;
};

export type MergeResult = {
  /** The purchases the phone must keep after the merge. */
  purchases: Purchase[];
  changes: ChangeLog;
  /** Purchases created or changed on this phone: to write online. */
  toUpload: RemotePurchase[];
  /** Purchases deleted on this phone: to mark as deleted online. */
  toDeleteOnline: { id: string; changedAt: string }[];
  /** True when the purchases of the phone changed: the screens must read them again. */
  hasLocalChanges: boolean;
};

/**
 * Date given to a purchase whose last change is unknown, for example a demonstration purchase.
 * It is the oldest possible date: any dated change wins over it.
 */
export const UNKNOWN_CHANGE_DATE = '1970-01-01T00:00:00.000Z';

/**
 * Compares the copy of the phone with the online copy, purchase by purchase.
 * The most recent change wins, and a deletion is a change like any other.
 * Pure function: it reads nothing and writes nothing, so it is easy to test.
 */
export function mergePurchases(local: LocalCopy, remotePurchases: RemotePurchase[]): MergeResult {
  const remoteById = new Map(remotePurchases.map((remote) => [remote.purchase.id, remote]));
  const handledIds = new Set<string>();
  const result: MergeResult = {
    purchases: [],
    changes: {},
    toUpload: [],
    toDeleteOnline: [],
    hasLocalChanges: false,
  };

  function keep(purchase: Purchase, changedAt: string) {
    result.purchases.push(purchase);
    result.changes[purchase.id] = { changedAt, isDeleted: false };
  }

  function forget(id: string, changedAt: string) {
    result.changes[id] = { changedAt, isDeleted: true };
  }

  // 1. The purchases that are on the phone.
  for (const purchase of local.purchases) {
    handledIds.add(purchase.id);
    const changedAt = local.changes[purchase.id]?.changedAt ?? UNKNOWN_CHANGE_DATE;
    const remote = remoteById.get(purchase.id);

    if (remote === undefined || isNewer(changedAt, remote.changedAt)) {
      keep(purchase, changedAt);
      result.toUpload.push({ purchase, changedAt, isDeleted: false });
    } else if (isNewer(remote.changedAt, changedAt)) {
      result.hasLocalChanges = true;
      if (remote.isDeleted) forget(purchase.id, remote.changedAt);
      else keep(remote.purchase, remote.changedAt);
    } else {
      keep(purchase, changedAt);
    }
  }

  // 2. The purchases deleted on the phone.
  for (const [id, change] of Object.entries(local.changes)) {
    if (handledIds.has(id) || !change.isDeleted) continue;
    handledIds.add(id);
    const remote = remoteById.get(id);

    // Never sent online: no other phone knows it, the deletion has nothing left to say.
    if (remote === undefined) continue;

    if (isNewer(remote.changedAt, change.changedAt) && !remote.isDeleted) {
      // Changed on another phone after the deletion: the purchase comes back.
      result.hasLocalChanges = true;
      keep(remote.purchase, remote.changedAt);
    } else {
      forget(id, change.changedAt);
      if (!remote.isDeleted) result.toDeleteOnline.push({ id, changedAt: change.changedAt });
    }
  }

  // 3. The purchases that only exist online.
  for (const remote of remotePurchases) {
    if (handledIds.has(remote.purchase.id) || remote.isDeleted) continue;
    result.hasLocalChanges = true;
    keep(remote.purchase, remote.changedAt);
  }

  return result;
}

function isNewer(date: string, otherDate: string): boolean {
  return Date.parse(date) > Date.parse(otherDate);
}
