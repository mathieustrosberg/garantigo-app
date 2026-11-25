/*
 * Checks the synchronisation against the real online service.
 * Skipped unless a test account is given, so the CI never contacts any server:
 *
 *   SYNC_TEST_EMAIL=... SYNC_TEST_PASSWORD=... pnpm exec jest sync.integration
 *
 * The account is created on the first run. Every purchase written by the test is erased at the end.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { PurchaseInput } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';

import { createInMemoryChangeLogStore } from './change-log-store';
import { createSupabaseRemotePurchases, type RemotePurchases } from './remote-purchases';
import { createCloudClient } from './supabase-client';
import { syncPurchases } from './sync-purchases';
import { createTrackedPurchaseStorage } from './tracked-purchase-storage';

const email = process.env.SYNC_TEST_EMAIL;
const password = process.env.SYNC_TEST_PASSWORD;

// The test environment replaces `fetch` with a version that sends nothing.
// This gives back the real one, the one of Node.
const { runInThisContext } = jest.requireActual<{ runInThisContext: (code: string) => unknown }>(
  'node:vm',
);
const realFetch = runInThisContext('fetch') as typeof fetch;

const client = createCloudClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY,
  { fetch: realFetch },
);

const describeWithAccount = email && password && client ? describe : describe.skip;

// Every purchase of one run has this text in its id: the test only touches its own rows.
const RUN = `integration-${Date.now()}`;

function createPhone() {
  return createTrackedPurchaseStorage(
    createInMemoryPurchaseStorage([]),
    createInMemoryChangeLogStore(),
  );
}

async function signIn(cloud: SupabaseClient): Promise<string> {
  const credentials = { email: email ?? '', password: password ?? '' };
  const signedIn = await cloud.auth.signInWithPassword(credentials);
  if (signedIn.data.user) return signedIn.data.user.id;

  // First run: the account does not exist yet.
  const signedUp = await cloud.auth.signUp(credentials);
  if (signedUp.data.session && signedUp.data.user) return signedUp.data.user.id;

  throw new Error(`Cannot sign in: ${signedUp.error?.message ?? signedIn.error?.message}`);
}

describeWithAccount('synchronisation with the real online service', () => {
  const cloud = client as SupabaseClient;
  let account: RemotePurchases;

  const kettleInput: PurchaseInput = {
    name: `Bouilloire ${RUN}`,
    purchaseDate: '2026-05-02',
    warrantyMonths: 24,
    price: 39.9,
    category: 'kitchen',
  };

  async function getOwnPurchases() {
    const remotePurchases = await account.fetchAll();
    return remotePurchases.filter((remote) => remote.purchase.name.includes(RUN));
  }

  beforeAll(async () => {
    account = createSupabaseRemotePurchases(cloud, await signIn(cloud));
  });

  afterAll(async () => {
    await cloud.from('purchases').delete().like('name', `%${RUN}%`);
    await cloud.auth.signOut();
    await cloud.auth.stopAutoRefresh();
  });

  it('brings a purchase from one phone to another, then its change, then its deletion', async () => {
    const oldPhone = createPhone();
    const newPhone = createPhone();

    // Added on the old phone.
    const kettle = await oldPhone.add(kettleInput);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);
    expect((await newPhone.getAll()).filter((purchase) => purchase.id === kettle.id)).toEqual([
      kettle,
    ]);

    // Changed on the new phone: the price is removed.
    const cheaperKettle = { ...kettle, name: `Bouilloire inox ${RUN}`, price: undefined };
    await newPhone.update(cheaperKettle);
    await syncPurchases(newPhone, account);
    await syncPurchases(oldPhone, account);
    const [changedKettle] = (await oldPhone.getAll()).filter(
      (purchase) => purchase.id === kettle.id,
    );
    expect(changedKettle?.name).toBe(`Bouilloire inox ${RUN}`);
    expect(changedKettle?.price).toBeUndefined();

    // Deleted on the old phone.
    await oldPhone.remove(kettle.id);
    await syncPurchases(oldPhone, account);
    await syncPurchases(newPhone, account);
    expect((await newPhone.getAll()).filter((purchase) => purchase.id === kettle.id)).toEqual([]);

    const [deletedRow] = await getOwnPurchases();
    expect(deletedRow?.isDeleted).toBe(true);
  }, 30_000);
});
