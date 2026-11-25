import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { usePurchases } from '@/storage/purchases-context';

import type { RemotePurchases } from './remote-purchases';
import { syncPurchases } from './sync-purchases';
import type { TrackedPurchaseStorage } from './tracked-purchase-storage';

/**
 * - 'signedOut': nobody is signed in, the purchases stay on the phone.
 * - 'syncing': the phone and the online copy are being compared.
 * - 'synced': the last synchronisation succeeded.
 * - 'failed': the last synchronisation failed, usually because there is no network.
 */
export type SyncStatus = 'signedOut' | 'syncing' | 'synced' | 'failed';

type SyncContextValue = {
  status: SyncStatus;
  /** Synchronises now. Does nothing when nobody is signed in. */
  syncNow: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

type SyncProviderProps = {
  storage: TrackedPurchaseStorage;
  /** The online copy of the signed-in account, or null when nobody is signed in. */
  remote: RemotePurchases | null;
  children: ReactNode;
};

/**
 * Keeps the phone and the online copy in step, without the screens asking for it:
 * at sign-in, when the application comes back to the front, and after each change.
 */
export function SyncProvider({ storage, remote, children }: SyncProviderProps) {
  const { refresh, status: purchasesStatus } = usePurchases();
  const arePurchasesReady = purchasesStatus === 'ready';
  const [lastOutcome, setLastOutcome] = useState<Exclude<SyncStatus, 'signedOut'>>('syncing');
  const syncNowRef = useRef<() => void>(() => {});

  // The effect below must not start again each time `refresh` changes: it reads it from here.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    // The first synchronisation waits for the purchases of the phone to be loaded.
    if (remote === null || !arePurchasesReady) return;

    let isStopped = false;
    let isRunning = false;
    let isAskedAgain = false;

    async function run(account: RemotePurchases) {
      // One synchronisation at a time: a request made meanwhile runs right after.
      if (isRunning) {
        isAskedAgain = true;
        return;
      }

      isRunning = true;
      setLastOutcome('syncing');
      try {
        do {
          isAskedAgain = false;
          const hasLocalChanges = await syncPurchases(storage, account);
          if (hasLocalChanges && !isStopped) await refreshRef.current();
        } while (isAskedAgain && !isStopped);
        if (!isStopped) setLastOutcome('synced');
      } catch {
        // Nothing is lost: the purchases are on the phone and the next attempt sends them.
        if (!isStopped) setLastOutcome('failed');
      } finally {
        isRunning = false;
      }
    }

    const syncNow = () => {
      run(remote);
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
  }, [storage, remote, arePurchasesReady]);

  const status: SyncStatus = remote === null ? 'signedOut' : lastOutcome;

  return (
    <SyncContext.Provider value={{ status, syncNow: () => syncNowRef.current() }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (context === null) {
    throw new Error('useSync must be used inside a SyncProvider');
  }
  return context;
}
