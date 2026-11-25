import type { SupabaseClient } from '@supabase/supabase-js';

import { createInMemoryRemotePhotos, createSupabaseRemotePhotos } from './remote-photos';
import { RemoteError } from './remote-purchases';

const USER_ID = 'account-1';
const CONTENT = new ArrayBuffer(4);

type Answer = { data?: unknown; error: { message: string } | null };

/** A stand-in for the online service: it records what it is asked and answers what the test says. */
function createFakeClient(answer: Answer = { data: [], error: null }) {
  const calls: unknown[][] = [];
  const record =
    (name: string) =>
    async (...args: unknown[]) => {
      calls.push([name, ...args]);
      return answer;
    };

  const client = {
    storage: {
      from(bucket: string) {
        calls.push(['from', bucket]);
        return {
          list: record('list'),
          upload: record('upload'),
          createSignedUrl: record('createSignedUrl'),
          remove: record('remove'),
        };
      },
    },
  } as unknown as SupabaseClient;

  return { client, calls };
}

describe('createSupabaseRemotePhotos', () => {
  it('lists the photos of the folder of the account, without the hidden files', async () => {
    const { client, calls } = createFakeClient({
      data: [{ name: 'receipt-1.jpg' }, { name: '.emptyFolderPlaceholder' }],
      error: null,
    });

    const names = await createSupabaseRemotePhotos(client, USER_ID).list();

    expect(names).toEqual(['receipt-1.jpg']);
    expect(calls).toEqual([
      ['from', 'receipts'],
      ['list', USER_ID, { limit: 1000 }],
    ]);
  });

  it('uploads a photo into the folder of the account', async () => {
    const { client, calls } = createFakeClient();

    await createSupabaseRemotePhotos(client, USER_ID).upload('receipt-1.jpg', CONTENT);

    expect(calls[1]).toEqual([
      'upload',
      'account-1/receipt-1.jpg',
      CONTENT,
      { contentType: 'image/jpeg', upsert: true },
    ]);
  });

  it('asks for a temporary address to download a photo', async () => {
    const { client, calls } = createFakeClient({
      data: { signedUrl: 'https://example.com/signed' },
      error: null,
    });

    const url = await createSupabaseRemotePhotos(client, USER_ID).getDownloadUrl('receipt-1.jpg');

    expect(url).toBe('https://example.com/signed');
    expect(calls[1]).toEqual(['createSignedUrl', 'account-1/receipt-1.jpg', 60]);
  });

  it('removes photos from the folder of the account', async () => {
    const { client, calls } = createFakeClient();

    await createSupabaseRemotePhotos(client, USER_ID).remove(['receipt-1.jpg', 'receipt-2.jpg']);

    expect(calls[1]).toEqual(['remove', ['account-1/receipt-1.jpg', 'account-1/receipt-2.jpg']]);
  });

  it('rejects with a RemoteError when the online service refuses', async () => {
    const { client } = createFakeClient({ error: { message: 'permission denied' } });
    const photos = createSupabaseRemotePhotos(client, USER_ID);

    await expect(photos.list()).rejects.toBeInstanceOf(RemoteError);
    await expect(photos.upload('receipt-1.jpg', CONTENT)).rejects.toBeInstanceOf(RemoteError);
    await expect(photos.getDownloadUrl('receipt-1.jpg')).rejects.toBeInstanceOf(RemoteError);
    await expect(photos.remove(['receipt-1.jpg'])).rejects.toBeInstanceOf(RemoteError);
  });
});

describe('createInMemoryRemotePhotos', () => {
  it('keeps the uploaded photos until they are removed', async () => {
    const photos = createInMemoryRemotePhotos();

    await photos.upload('receipt-1.jpg', CONTENT);
    expect(await photos.list()).toEqual(['receipt-1.jpg']);
    expect(await photos.getDownloadUrl('receipt-1.jpg')).toBe('memory://receipt-1.jpg');

    await photos.remove(['receipt-1.jpg']);
    expect(await photos.list()).toEqual([]);
  });

  it('refuses to give the address of a photo it does not have', async () => {
    await expect(createInMemoryRemotePhotos().getDownloadUrl('unknown.jpg')).rejects.toBeInstanceOf(
      RemoteError,
    );
  });
});
