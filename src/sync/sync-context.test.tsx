import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Pressable, Text, type AppStateStatus } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { PurchasesProvider, usePurchases } from '@/storage/purchases-context';

import { createInMemoryChangeLogStore } from './change-log-store';
import { createInMemoryOwnerStore } from './owner-store';
import { createInMemoryRemotePhotos } from './remote-photos';
import { createInMemoryRemotePurchases, type RemotePurchases } from './remote-purchases';
import { SyncProvider, useSync } from './sync-context';
import type { LocalPhotos, RemotePhotos } from './sync-photos';
import { createTrackedPurchaseStorage } from './tracked-purchase-storage';

const NOW = '2026-11-24T10:00:00.000Z';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

const toaster: Purchase = {
  id: 'toaster',
  name: 'Grille-pain',
  purchaseDate: '2026-03-01',
  warrantyMonths: 24,
};

function Probe() {
  const { purchases, addPurchase } = usePurchases();
  const { status, syncNow } = useSync();
  const names = purchases.map((purchase) => purchase.name).sort();

  return (
    <>
      <Text>{`${status} : ${names.join(', ')}`}</Text>
      <Pressable
        onPress={() =>
          addPurchase({ name: 'Bouilloire', purchaseDate: '2026-10-02', warrantyMonths: 12 })
        }
      >
        <Text>Ajouter</Text>
      </Pressable>
      <Pressable onPress={syncNow}>
        <Text>Synchroniser</Text>
      </Pressable>
    </>
  );
}

/** A phone without any receipt photo, which keeps the name of what it downloads. */
function createPhonePhotos() {
  const downloadedNames: string[] = [];
  const photos: LocalPhotos = {
    has: (fileName) => downloadedNames.includes(fileName),
    read: async () => new ArrayBuffer(0),
    download: async (_url, fileName) => {
      downloadedNames.push(fileName);
    },
  };
  return { photos, downloadedNames };
}

type RenderOptions = {
  localPhotos?: LocalPhotos;
  remotePhotos?: RemotePhotos;
};

async function renderProbe(remote: RemotePurchases | null, options: RenderOptions = {}) {
  const storage = createTrackedPurchaseStorage(
    createInMemoryPurchaseStorage([headphones]),
    createInMemoryChangeLogStore(),
    createInMemoryOwnerStore(),
  );

  await render(
    <PurchasesProvider storage={storage}>
      <SyncProvider
        storage={storage}
        remote={remote}
        localPhotos={options.localPhotos ?? createPhonePhotos().photos}
        remotePhotos={
          remote === null ? null : (options.remotePhotos ?? createInMemoryRemotePhotos())
        }
      >
        <Probe />
      </SyncProvider>
    </PurchasesProvider>,
  );
}

async function getOnlineNames(account: RemotePurchases) {
  const remotePurchases = await account.fetchAll();
  return remotePurchases.map((remote) => remote.purchase.name).sort();
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SyncProvider', () => {
  it('leaves the purchases on the phone when nobody is signed in', async () => {
    await renderProbe(null);

    expect(await screen.findByText('signedOut : Casque audio')).toBeTruthy();
  });

  it('downloads the purchases of the account at sign-in', async () => {
    const account = createInMemoryRemotePurchases();
    await account.upload([{ purchase: toaster, changedAt: NOW, isDeleted: false }]);

    await renderProbe(account);

    expect(await screen.findByText('synced : Casque audio, Grille-pain')).toBeTruthy();
  });

  it('sends the purchases of the phone to the account at sign-in', async () => {
    const account = createInMemoryRemotePurchases();

    await renderProbe(account);
    await screen.findByText('synced : Casque audio');

    expect(await getOnlineNames(account)).toEqual(['Casque audio']);
  });

  it('sends a purchase online right after it is added on the phone', async () => {
    const account = createInMemoryRemotePurchases();
    await renderProbe(account);
    await screen.findByText('synced : Casque audio');

    await fireEvent.press(screen.getByText('Ajouter'));

    await waitFor(async () => {
      expect(await getOnlineNames(account)).toEqual(['Bouilloire', 'Casque audio']);
    });
    expect(await screen.findByText('synced : Bouilloire, Casque audio')).toBeTruthy();
  });

  it('downloads the receipt photo of a purchase that comes from the account', async () => {
    const account = createInMemoryRemotePurchases();
    await account.upload([
      {
        purchase: { ...toaster, receiptFileName: 'receipt-1.jpg' },
        changedAt: NOW,
        isDeleted: false,
      },
    ]);
    const remotePhotos = createInMemoryRemotePhotos();
    await remotePhotos.upload('receipt-1.jpg', new ArrayBuffer(4));
    const phone = createPhonePhotos();

    await renderProbe(account, { localPhotos: phone.photos, remotePhotos });
    await screen.findByText('synced : Casque audio, Grille-pain');

    expect(phone.downloadedNames).toEqual(['receipt-1.jpg']);
  });

  it('says that the synchronisation failed when the photos cannot be reached', async () => {
    const remotePhotos: RemotePhotos = {
      ...createInMemoryRemotePhotos(),
      list: () => Promise.reject(new Error('offline')),
    };

    await renderProbe(createInMemoryRemotePurchases(), { remotePhotos });

    expect(await screen.findByText('failed : Casque audio')).toBeTruthy();
  });

  it('keeps the purchases of the phone and says so when the network fails', async () => {
    const account: RemotePurchases = {
      ...createInMemoryRemotePurchases(),
      fetchAll: () => Promise.reject(new Error('offline')),
    };

    await renderProbe(account);

    expect(await screen.findByText('failed : Casque audio')).toBeTruthy();
  });

  it('synchronises again when asked, for example after the network came back', async () => {
    const account = createInMemoryRemotePurchases();
    const fetchAll = jest.spyOn(account, 'fetchAll').mockRejectedValueOnce(new Error('offline'));
    await renderProbe(account);
    await screen.findByText('failed : Casque audio');

    await fireEvent.press(screen.getByText('Synchroniser'));

    expect(await screen.findByText('synced : Casque audio')).toBeTruthy();
    expect(fetchAll).toHaveBeenCalledTimes(2);
  });

  it('synchronises again when the application comes back to the front', async () => {
    let onAppStateChange: (state: AppStateStatus) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onAppStateChange = listener;
      return { remove: jest.fn() } as never;
    });
    const account = createInMemoryRemotePurchases();
    await renderProbe(account);
    await screen.findByText('synced : Casque audio');

    // Another phone added a purchase while this application was in the background.
    await account.upload([{ purchase: toaster, changedAt: NOW, isDeleted: false }]);
    onAppStateChange('active');

    expect(await screen.findByText('synced : Casque audio, Grille-pain')).toBeTruthy();
  });
});
