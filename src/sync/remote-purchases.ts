import type { SupabaseClient } from '@supabase/supabase-js';

import type { Purchase, PurchaseCategory } from '@/purchases/purchase';

import type { RemotePurchase } from './merge-purchases';

/** Everything the synchronisation needs from the online copy of one account. */
export interface RemotePurchases {
  /** Id of the account this copy belongs to. */
  readonly accountId: string;
  /** Every purchase of the account, the deleted ones included. */
  fetchAll(): Promise<RemotePurchase[]>;
  /** Creates the purchases online, or replaces them when they already exist. */
  upload(purchases: RemotePurchase[]): Promise<void>;
  /** Marks purchases as deleted, so that the other phones delete them too. */
  markDeleted(deletions: { id: string; changedAt: string }[]): Promise<void>;
}

/** Says that the online copy could not be reached or refused the request. */
export class RemoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteError';
  }
}

/** One row of the `purchases` table (see supabase/schema.sql). */
type PurchaseRow = {
  id: string;
  user_id: string;
  name: string;
  purchase_date: string;
  warranty_months: number;
  price: number | null;
  category: PurchaseCategory | null;
  receipt_file_name: string | null;
  updated_at: string;
  deleted_at: string | null;
};

const TABLE = 'purchases';

/** The online copy of the account `userId`, kept in the Supabase project. */
export function createSupabaseRemotePurchases(
  client: SupabaseClient,
  userId: string,
): RemotePurchases {
  return {
    accountId: userId,

    async fetchAll() {
      // The access rules of the database only give the rows of the signed-in account.
      const { data, error } = await client.from(TABLE).select('*');
      if (error) throw new RemoteError(error.message);

      return (data as PurchaseRow[]).map(toRemotePurchase);
    },

    async upload(purchases) {
      if (purchases.length === 0) return;

      const rows = purchases.map((remote) => toRow(remote, userId));
      const { error } = await client.from(TABLE).upsert(rows, { onConflict: 'user_id,id' });
      if (error) throw new RemoteError(error.message);
    },

    async markDeleted(deletions) {
      for (const { id, changedAt } of deletions) {
        const { error } = await client
          .from(TABLE)
          .update({ updated_at: changedAt, deleted_at: changedAt })
          .eq('user_id', userId)
          .eq('id', id);
        if (error) throw new RemoteError(error.message);
      }
    },
  };
}

function toRow({ purchase, changedAt }: RemotePurchase, userId: string): PurchaseRow {
  return {
    id: purchase.id,
    user_id: userId,
    name: purchase.name,
    purchase_date: purchase.purchaseDate,
    warranty_months: purchase.warrantyMonths,
    // null empties the column: a price removed on the phone is removed online too.
    price: purchase.price ?? null,
    category: purchase.category ?? null,
    receipt_file_name: purchase.receiptFileName ?? null,
    updated_at: changedAt,
    // An uploaded purchase is alive, even if it had been deleted before.
    deleted_at: null,
  };
}

function toRemotePurchase(row: PurchaseRow): RemotePurchase {
  const purchase: Purchase = {
    id: row.id,
    name: row.name,
    purchaseDate: row.purchase_date,
    warrantyMonths: row.warranty_months,
  };
  // An absent piece of information is left out, as the form does: never stored as null.
  if (row.price !== null) purchase.price = row.price;
  if (row.category !== null) purchase.category = row.category;
  if (row.receipt_file_name !== null) purchase.receiptFileName = row.receipt_file_name;

  return { purchase, changedAt: row.updated_at, isDeleted: row.deleted_at !== null };
}

/** An online copy kept in memory. In tests, two phones share it like a real account. */
export function createInMemoryRemotePurchases(accountId = 'test-account'): RemotePurchases {
  const rows = new Map<string, RemotePurchase>();

  return {
    accountId,

    async fetchAll() {
      return [...rows.values()];
    },

    async upload(purchases) {
      for (const remote of purchases) rows.set(remote.purchase.id, remote);
    },

    async markDeleted(deletions) {
      for (const { id, changedAt } of deletions) {
        const row = rows.get(id);
        if (row !== undefined) rows.set(id, { ...row, changedAt, isDeleted: true });
      }
    },
  };
}
