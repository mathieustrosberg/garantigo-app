import type { Purchase } from '@/purchases/purchase';

import { createInMemoryRemotePhotos } from './remote-photos';
import { syncPhotos, type LocalPhotos } from './sync-photos';

/** The receipt photos of a phone, kept in memory: only their names matter here. */
function createPhonePhotos(fileNames: string[] = []) {
  const files = new Set(fileNames);
  const photos: LocalPhotos = {
    has: (fileName) => files.has(fileName),
    read: async (fileName) => new TextEncoder().encode(fileName).buffer as ArrayBuffer,
    download: async (_url, fileName) => {
      files.add(fileName);
    },
  };
  return { photos, files };
}

function createPurchase(id: string, receiptFileName?: string): Purchase {
  return { id, name: id, purchaseDate: '2026-01-15', warrantyMonths: 24, receiptFileName };
}

describe('syncPhotos', () => {
  it('sends online a photo taken on this phone', async () => {
    const phone = createPhonePhotos(['receipt-1.jpg']);
    const account = createInMemoryRemotePhotos();

    const hasDownloaded = await syncPhotos(
      [createPurchase('kettle', 'receipt-1.jpg')],
      phone.photos,
      account,
    );

    expect(await account.list()).toEqual(['receipt-1.jpg']);
    expect(hasDownloaded).toBe(false);
  });

  it('brings to this phone a photo taken on another phone', async () => {
    const oldPhone = createPhonePhotos(['receipt-1.jpg']);
    const newPhone = createPhonePhotos();
    const account = createInMemoryRemotePhotos();
    const purchases = [createPurchase('kettle', 'receipt-1.jpg')];
    await syncPhotos(purchases, oldPhone.photos, account);

    const hasDownloaded = await syncPhotos(purchases, newPhone.photos, account);

    expect(newPhone.files.has('receipt-1.jpg')).toBe(true);
    expect(hasDownloaded).toBe(true);
  });

  it('sends nothing again when the photo is already on both sides', async () => {
    const phone = createPhonePhotos(['receipt-1.jpg']);
    const account = createInMemoryRemotePhotos();
    const purchases = [createPurchase('kettle', 'receipt-1.jpg')];
    await syncPhotos(purchases, phone.photos, account);
    const upload = jest.spyOn(account, 'upload');

    const hasDownloaded = await syncPhotos(purchases, phone.photos, account);

    expect(upload).not.toHaveBeenCalled();
    expect(hasDownloaded).toBe(false);
  });

  it('waits for a photo that is neither on this phone nor online yet', async () => {
    const phone = createPhonePhotos();
    const account = createInMemoryRemotePhotos();

    const hasDownloaded = await syncPhotos(
      [createPurchase('kettle', 'receipt-1.jpg')],
      phone.photos,
      account,
    );

    expect(hasDownloaded).toBe(false);
    expect(await account.list()).toEqual([]);
  });

  it('removes online the photo of a deleted purchase', async () => {
    const phone = createPhonePhotos(['receipt-1.jpg']);
    const account = createInMemoryRemotePhotos();
    await syncPhotos([createPurchase('kettle', 'receipt-1.jpg')], phone.photos, account);

    await syncPhotos([], phone.photos, account);

    expect(await account.list()).toEqual([]);
  });

  it('replaces online a photo that was taken again', async () => {
    const phone = createPhonePhotos(['receipt-1.jpg', 'receipt-2.jpg']);
    const account = createInMemoryRemotePhotos();
    await syncPhotos([createPurchase('kettle', 'receipt-1.jpg')], phone.photos, account);

    await syncPhotos([createPurchase('kettle', 'receipt-2.jpg')], phone.photos, account);

    expect(await account.list()).toEqual(['receipt-2.jpg']);
  });

  it('never sends a photo that no purchase names, like one just taken in the form', async () => {
    const phone = createPhonePhotos(['receipt-not-saved-yet.jpg']);
    const account = createInMemoryRemotePhotos();

    await syncPhotos([createPurchase('kettle')], phone.photos, account);

    expect(await account.list()).toEqual([]);
    expect(phone.files.has('receipt-not-saved-yet.jpg')).toBe(true);
  });

  it('keeps going with the photos of several purchases', async () => {
    const phone = createPhonePhotos(['receipt-1.jpg']);
    const otherPhone = createPhonePhotos(['receipt-2.jpg']);
    const account = createInMemoryRemotePhotos();
    const purchases = [
      createPurchase('kettle', 'receipt-1.jpg'),
      createPurchase('toaster', 'receipt-2.jpg'),
    ];
    await syncPhotos(purchases, otherPhone.photos, account);

    await syncPhotos(purchases, phone.photos, account);

    expect((await account.list()).sort()).toEqual(['receipt-1.jpg', 'receipt-2.jpg']);
    expect(phone.files.has('receipt-2.jpg')).toBe(true);
  });
});
