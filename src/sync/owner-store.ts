import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError } from '@/storage/purchase-storage';

export const OWNER_STORAGE_KEY = 'garantigo.owner.v1';

/** Where the phone keeps the id of the account its purchases belong to. */
export interface OwnerStore {
  /** null as long as no account has ever been synchronised on this phone. */
  read(): Promise<string | null>;
  write(accountId: string): Promise<void>;
}

/** Keeps the owner on the phone, so it survives a restart. */
export function createAsyncOwnerStore(): OwnerStore {
  return {
    async read() {
      try {
        return await AsyncStorage.getItem(OWNER_STORAGE_KEY);
      } catch {
        throw new StorageError('read');
      }
    },

    async write(accountId) {
      try {
        await AsyncStorage.setItem(OWNER_STORAGE_KEY, accountId);
      } catch {
        throw new StorageError('write');
      }
    },
  };
}

/** Keeps the owner in memory only. Used in tests. */
export function createInMemoryOwnerStore(initialOwner: string | null = null): OwnerStore {
  let owner = initialOwner;

  return {
    async read() {
      return owner;
    },

    async write(accountId) {
      owner = accountId;
    },
  };
}
