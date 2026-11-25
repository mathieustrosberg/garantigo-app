import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError } from '@/storage/purchase-storage';

import {
  CHANGE_LOG_STORAGE_KEY,
  createAsyncChangeLogStore,
  createInMemoryChangeLogStore,
} from './change-log-store';

const CHANGES = { headphones: { changedAt: '2026-11-24T10:00:00.000Z', isDeleted: false } };

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('createAsyncChangeLogStore', () => {
  it('is empty when nothing was ever saved', async () => {
    expect(await createAsyncChangeLogStore().read()).toEqual({});
  });

  it('keeps the changes after a restart of the application', async () => {
    await createAsyncChangeLogStore().write(CHANGES);

    expect(await createAsyncChangeLogStore().read()).toEqual(CHANGES);
  });

  it('rejects with a StorageError when the saved value cannot be read', async () => {
    await AsyncStorage.setItem(CHANGE_LOG_STORAGE_KEY, 'not json');

    await expect(createAsyncChangeLogStore().read()).rejects.toBeInstanceOf(StorageError);
  });

  it('rejects with a StorageError when the phone storage fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(createAsyncChangeLogStore().write(CHANGES)).rejects.toBeInstanceOf(StorageError);
  });
});

describe('createInMemoryChangeLogStore', () => {
  it('gives back what was written', async () => {
    const store = createInMemoryChangeLogStore();

    await store.write(CHANGES);

    expect(await store.read()).toEqual(CHANGES);
  });
});
