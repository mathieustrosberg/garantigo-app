import AsyncStorage from '@react-native-async-storage/async-storage';

import { StorageError } from '@/storage/purchase-storage';

import { createAsyncOwnerStore, createInMemoryOwnerStore } from './owner-store';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('createAsyncOwnerStore', () => {
  it('has no owner as long as no account was synchronised', async () => {
    expect(await createAsyncOwnerStore().read()).toBeNull();
  });

  it('keeps the owner after a restart of the application', async () => {
    await createAsyncOwnerStore().write('account-1');

    expect(await createAsyncOwnerStore().read()).toBe('account-1');
  });

  it('rejects with a StorageError when the phone storage fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(createAsyncOwnerStore().write('account-1')).rejects.toBeInstanceOf(StorageError);
  });
});

describe('createInMemoryOwnerStore', () => {
  it('gives back the owner it was given', async () => {
    const store = createInMemoryOwnerStore();

    await store.write('account-1');

    expect(await store.read()).toBe('account-1');
  });
});
