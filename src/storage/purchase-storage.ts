import type { Purchase, PurchaseInput } from '@/purchases/purchase';

/**
 * Everything the application needs to read and write purchases.
 * The screens only know this interface, not where the data really lives.
 * Every method rejects with a StorageError when the phone storage fails.
 */
export interface PurchaseStorage {
  getAll(): Promise<Purchase[]>;
  add(input: PurchaseInput): Promise<Purchase>;
  update(purchase: Purchase): Promise<Purchase>;
  remove(id: string): Promise<void>;
}

export type StorageOperation = 'read' | 'write';

/** Says whether the storage failed while reading or while writing. */
export class StorageError extends Error {
  readonly operation: StorageOperation;

  constructor(operation: StorageOperation) {
    super(`Purchase storage failed during ${operation}`);
    this.name = 'StorageError';
    this.operation = operation;
  }
}
