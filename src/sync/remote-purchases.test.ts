import type { SupabaseClient } from '@supabase/supabase-js';

import type { Purchase } from '@/purchases/purchase';

import {
  createInMemoryRemotePurchases,
  createSupabaseRemotePurchases,
  RemoteError,
} from './remote-purchases';

const NOW = '2026-11-24T10:00:00.000Z';
const USER_ID = 'account-1';

const kettle: Purchase = {
  id: 'kettle',
  name: 'Bouilloire',
  purchaseDate: '2026-05-02',
  warrantyMonths: 24,
  price: 39.9,
  category: 'kitchen',
  receiptFileName: 'receipt-1.jpg',
};

const kettleRow = {
  id: 'kettle',
  user_id: USER_ID,
  name: 'Bouilloire',
  purchase_date: '2026-05-02',
  warranty_months: 24,
  price: 39.9,
  category: 'kitchen',
  receipt_file_name: 'receipt-1.jpg',
  updated_at: NOW,
  deleted_at: null,
};

type Answer = { data?: unknown; error: { message: string } | null };

/** A stand-in for the online service: it records what it is asked and answers what the test says. */
function createFakeClient(answer: Answer = { error: null }) {
  const calls: unknown[][] = [];
  const filters = {
    eq(column: string, value: string) {
      calls.push(['eq', column, value]);
      return filters;
    },
    then(resolve: (value: Answer) => void) {
      resolve(answer);
    },
  };

  const client = {
    from(table: string) {
      calls.push(['from', table]);
      return {
        select: async (columns: string) => {
          calls.push(['select', columns]);
          return answer;
        },
        upsert: async (rows: unknown, options: unknown) => {
          calls.push(['upsert', rows, options]);
          return answer;
        },
        update(values: unknown) {
          calls.push(['update', values]);
          return filters;
        },
      };
    },
  } as unknown as SupabaseClient;

  return { client, calls };
}

describe('createSupabaseRemotePurchases', () => {
  it('reads the rows of the table as purchases', async () => {
    const { client } = createFakeClient({ data: [kettleRow], error: null });

    const remotePurchases = await createSupabaseRemotePurchases(client, USER_ID).fetchAll();

    expect(remotePurchases).toEqual([{ purchase: kettle, changedAt: NOW, isDeleted: false }]);
  });

  it('leaves out the information that the row does not have', async () => {
    const emptyRow = { ...kettleRow, price: null, category: null, receipt_file_name: null };
    const { client } = createFakeClient({ data: [emptyRow], error: null });

    const [remote] = await createSupabaseRemotePurchases(client, USER_ID).fetchAll();

    expect(remote?.purchase).toEqual({
      id: 'kettle',
      name: 'Bouilloire',
      purchaseDate: '2026-05-02',
      warrantyMonths: 24,
    });
  });

  it('reads a row marked as deleted as a deleted purchase', async () => {
    const { client } = createFakeClient({ data: [{ ...kettleRow, deleted_at: NOW }], error: null });

    const [remote] = await createSupabaseRemotePurchases(client, USER_ID).fetchAll();

    expect(remote?.isDeleted).toBe(true);
  });

  it('writes a purchase as a row of the account', async () => {
    const { client, calls } = createFakeClient();

    await createSupabaseRemotePurchases(client, USER_ID).upload([
      { purchase: kettle, changedAt: NOW, isDeleted: false },
    ]);

    expect(calls).toEqual([
      ['from', 'purchases'],
      ['upsert', [kettleRow], { onConflict: 'user_id,id' }],
    ]);
  });

  it('empties the columns of the information removed on the phone', async () => {
    const { client, calls } = createFakeClient();
    const bareKettle = {
      ...kettle,
      price: undefined,
      category: undefined,
      receiptFileName: undefined,
    };

    await createSupabaseRemotePurchases(client, USER_ID).upload([
      { purchase: bareKettle, changedAt: NOW, isDeleted: false },
    ]);

    expect(calls[1]?.[1]).toEqual([
      { ...kettleRow, price: null, category: null, receipt_file_name: null },
    ]);
  });

  it('asks nothing when there is nothing to write', async () => {
    const { client, calls } = createFakeClient();

    await createSupabaseRemotePurchases(client, USER_ID).upload([]);

    expect(calls).toEqual([]);
  });

  it('marks a purchase of the account as deleted without erasing its row', async () => {
    const { client, calls } = createFakeClient();

    await createSupabaseRemotePurchases(client, USER_ID).markDeleted([
      { id: 'kettle', changedAt: NOW },
    ]);

    expect(calls).toEqual([
      ['from', 'purchases'],
      ['update', { updated_at: NOW, deleted_at: NOW }],
      ['eq', 'user_id', USER_ID],
      ['eq', 'id', 'kettle'],
    ]);
  });

  it('rejects with a RemoteError when the online service refuses', async () => {
    const { client } = createFakeClient({ error: { message: 'permission denied' } });
    const remote = createSupabaseRemotePurchases(client, USER_ID);

    await expect(remote.fetchAll()).rejects.toBeInstanceOf(RemoteError);
    await expect(
      remote.upload([{ purchase: kettle, changedAt: NOW, isDeleted: false }]),
    ).rejects.toBeInstanceOf(RemoteError);
    await expect(remote.markDeleted([{ id: 'kettle', changedAt: NOW }])).rejects.toBeInstanceOf(
      RemoteError,
    );
  });
});

describe('createInMemoryRemotePurchases', () => {
  it('keeps a deleted purchase, marked as deleted', async () => {
    const remote = createInMemoryRemotePurchases();
    await remote.upload([{ purchase: kettle, changedAt: NOW, isDeleted: false }]);

    await remote.markDeleted([{ id: 'kettle', changedAt: '2026-11-25T10:00:00.000Z' }]);

    expect(await remote.fetchAll()).toEqual([
      { purchase: kettle, changedAt: '2026-11-25T10:00:00.000Z', isDeleted: true },
    ]);
  });
});
