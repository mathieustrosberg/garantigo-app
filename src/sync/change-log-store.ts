import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError } from '@/storage/purchase-storage';

import type { ChangeLog } from './merge-purchases';

export const CHANGE_LOG_STORAGE_KEY = 'garantigo.changes.v1';

/** Where the phone keeps the date of the last change of each purchase. */
export interface ChangeLogStore {
  read(): Promise<ChangeLog>;
  write(changes: ChangeLog): Promise<void>;
}

/** Keeps the change log on the phone, next to the purchases, so it survives a restart. */
export function createAsyncChangeLogStore(): ChangeLogStore {
  return {
    async read() {
      try {
        const savedValue = await AsyncStorage.getItem(CHANGE_LOG_STORAGE_KEY);
        // Nothing saved yet: no purchase has a known change.
        return savedValue === null ? {} : (JSON.parse(savedValue) as ChangeLog);
      } catch {
        throw new StorageError('read');
      }
    },

    async write(changes) {
      try {
        await AsyncStorage.setItem(CHANGE_LOG_STORAGE_KEY, JSON.stringify(changes));
      } catch {
        throw new StorageError('write');
      }
    },
  };
}

/** Keeps the change log in memory only. Used in tests. */
export function createInMemoryChangeLogStore(initialChanges: ChangeLog = {}): ChangeLogStore {
  let changes = { ...initialChanges };

  return {
    async read() {
      return changes;
    },

    async write(newChanges) {
      changes = { ...newChanges };
    },
  };
}
