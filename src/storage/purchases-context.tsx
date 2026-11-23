import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Purchase, PurchaseInput } from '@/purchases/purchase';

import type { PurchaseStorage } from './purchase-storage';

type LoadStatus = 'loading' | 'ready' | 'error';

type PurchasesContextValue = {
  purchases: Purchase[];
  status: LoadStatus;
  addPurchase: (input: PurchaseInput) => Promise<Purchase>;
  updatePurchase: (purchase: Purchase) => Promise<void>;
  removePurchase: (id: string) => Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

type PurchasesProviderProps = {
  storage: PurchaseStorage;
  children: ReactNode;
};

/** Loads the purchases once and shares the same list with every screen. */
export function PurchasesProvider({ storage, children }: PurchasesProviderProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    let isCancelled = false;

    storage.getAll().then(
      (loadedPurchases) => {
        if (isCancelled) return;
        setPurchases(loadedPurchases);
        setStatus('ready');
      },
      () => {
        if (!isCancelled) setStatus('error');
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [storage]);

  async function refresh() {
    setPurchases(await storage.getAll());
  }

  async function addPurchase(input: PurchaseInput) {
    const purchase = await storage.add(input);
    await refresh();
    return purchase;
  }

  async function updatePurchase(purchase: Purchase) {
    await storage.update(purchase);
    await refresh();
  }

  async function removePurchase(id: string) {
    await storage.remove(id);
    await refresh();
  }

  return (
    <PurchasesContext.Provider
      value={{ purchases, status, addPurchase, updatePurchase, removePurchase }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases(): PurchasesContextValue {
  const context = useContext(PurchasesContext);
  if (context === null) {
    throw new Error('usePurchases must be used inside a PurchasesProvider');
  }
  return context;
}
