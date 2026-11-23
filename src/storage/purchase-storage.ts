import type { Purchase, PurchaseInput } from '@/purchases/purchase';

/**
 * Everything the application needs to read and write purchases.
 * The screens only know this interface, not where the data really lives.
 */
export interface PurchaseStorage {
  getAll(): Promise<Purchase[]>;
  add(input: PurchaseInput): Promise<Purchase>;
  update(purchase: Purchase): Promise<Purchase>;
  remove(id: string): Promise<void>;
}
