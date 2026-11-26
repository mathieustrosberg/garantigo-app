import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { usePurchases } from '@/storage/purchases-context';

import type { RemotePurchases } from './remote-purchases';
import { syncPhotos, type LocalPhotos, type RemotePhotos } from './sync-photos';
import { syncPurchases } from './sync-purchases';
import type { TrackedPurchaseStorage } from './tracked-purchase-storage';

/**
 * - 'signedOut': nobody is signed in, the purchases stay on the phone.
 * - 'syncing': the phone and the online copy are being compared.
 * - 'synced': the last synchronisation succeeded.
 * - 'failed': the last synchronisation failed, usually because there is no network.
 */
export type SyncStatus = 'signedOut' | 'syncing' | 'synced' | 'failed';

/**
 * The phone copy belongs to one account. After a sign-in, it may still be the copy of the
 * account signed in before: the screens must not show it.
 * - 'checking': the owner of the phone copy is being read, nothing must be shown yet.
 * - 'ready': the phone copy belongs to the signed-in account, or nobody is signed in.
 * - 'failed': the check could not be done, because the phone storage failed.
 */
export type PhoneCopyStatus = 'checking' | 'ready' | 'failed';

/** The last check of the phone copy, and the account it was done for. */
type PhoneCopyCheck = {
  accountId: string;
  hasFailed: boolean;
};

type SyncContextValue = {
  status: SyncStatus;
  phoneCopyStatus: PhoneCopyStatus;
  /** Synchronises now. Does nothing when nobody is signed in. */
  syncNow: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

type SyncProviderProps = {
  storage: TrackedPurchaseStorage;
  /** The online copy of the signed-in account, or null when nobody is signed in. */
  remote: RemotePurchases | null;
  /** The receipt photos on the phone, and those of the signed-in account. */
  localPhotos: LocalPhotos;
  remotePhotos: RemotePhotos | null;
  children: ReactNode;
};

/**
 * Keeps the phone and the online copy in step, without the screens asking for it:
 * at sign-in, when the application comes back to the front, and after each change.
 */
export function SyncProvider({
  storage,
  remote,
  localPhotos,
  remotePhotos,
  children,
}: SyncProviderProps) {
  const { refresh, status: purchasesStatus } = usePurchases();
  const arePurchasesReady = purchasesStatus === 'ready';
  const [lastOutcome, setLastOutcome] = useState<Exclude<SyncStatus, 'signedOut'>>('syncing');
  const [phoneCopyCheck, setPhoneCopyCheck] = useState<PhoneCopyCheck | null>(null);
  const syncNowRef = useRef<() => void>(() => {});

  // The effect below must not start again each time `refresh` changes: it reads it from here.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    // The first synchronisation waits for the purchases of the phone to be loaded.
    if (remote === null || remotePhotos === null || !arePurchasesReady) return;

    let isStopped = false;
    let isRunning = false;
    let isAskedAgain = false;
    let isPhoneCopyChecked = false;

    /** Done once per sign-in, before the first synchronisation. It needs no network. */
    async function checkPhoneCopy(accountId: string) {
      const wasEmptied = await storage.emptyCopyOfAnotherAccount(accountId);
      // The screens must forget the purchases of the other account before they are shown.
      if (wasEmptied) await refreshRef.current();

      isPhoneCopyChecked = true;
      if (!isStopped) setPhoneCopyCheck({ accountId, hasFailed: false });
    }

    async function run(account: RemotePurchases, accountPhotos: RemotePhotos) {
      // One synchronisation at a time: a request made meanwhile runs right after.
      if (isRunning) {
        isAskedAgain = true;
        return;
      }

      isRunning = true;
      setLastOutcome('syncing');
      try {
        if (!isPhoneCopyChecked) await checkPhoneCopy(account.accountId);

        do {
          isAskedAgain = false;
          const hasLocalChanges = await syncPurchases(storage, account);
          // The purchases first: they say which photos are wanted.
          const hasNewPhotos = await syncPhotos(await storage.getAll(), localPhotos, accountPhotos);
          if ((hasLocalChanges || hasNewPhotos) && !isStopped) await refreshRef.current();
        } while (isAskedAgain && !isStopped);
        if (!isStopped) setLastOutcome('synced');
      } catch {
        // Nothing is lost: the purchases are on the phone and the next attempt sends them.
        if (!isStopped) setLastOutcome('failed');
        // The phone storage failed before the check ended: the screens stay hidden.
        if (!isStopped && !isPhoneCopyChecked) {
          setPhoneCopyCheck({ accountId: account.accountId, hasFailed: true });
        }
      } finally {
        isRunning = false;
      }
    }

    const syncNow = () => {
      run(remote, remotePhotos);
    };
    syncNowRef.current = syncNow;
    syncNow();

    const stopListening = storage.onLocalChange(syncNow);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });

    return () => {
      isStopped = true;
      syncNowRef.current = () => {};
      stopListening();
      appStateSubscription.remove();
    };
  }, [storage, remote, localPhotos, remotePhotos, arePurchasesReady]);

  const status: SyncStatus = remote === null ? 'signedOut' : lastOutcome;
  const phoneCopyStatus = getPhoneCopyStatus(remote, phoneCopyCheck);

  return (
    <SyncContext.Provider value={{ status, phoneCopyStatus, syncNow: () => syncNowRef.current() }}>
      {children}
    </SyncContext.Provider>
  );
}

function getPhoneCopyStatus(
  remote: RemotePurchases | null,
  check: PhoneCopyCheck | null,
): PhoneCopyStatus {
  // Nobody is signed in: there is no account to compare the phone copy with.
  if (remote === null) return 'ready';
  // A check done for another account says nothing about this one.
  if (check === null || check.accountId !== remote.accountId) return 'checking';
  return check.hasFailed ? 'failed' : 'ready';
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (context === null) {
    throw new Error('useSync must be used inside a SyncProvider');
  }
  return context;
}
