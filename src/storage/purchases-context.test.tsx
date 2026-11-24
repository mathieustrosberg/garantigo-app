import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import type { Purchase } from '@/purchases/purchase';

import { createInMemoryPurchaseStorage } from './in-memory-purchase-storage';
import { StorageError, type PurchaseStorage } from './purchase-storage';
import { PurchasesProvider, usePurchases } from './purchases-context';
import { getStorageErrorMessage, WRITE_ERROR_MESSAGE } from './storage-error-message';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

function PurchasesProbe() {
  const { purchases, status, addPurchase, removePurchase } = usePurchases();

  return (
    <>
      <Text>{`${status} : ${purchases.map((purchase) => purchase.name).join(', ')}`}</Text>
      <Pressable
        onPress={() =>
          addPurchase({ name: 'Bouilloire', purchaseDate: '2026-10-02', warrantyMonths: 12 })
        }
      >
        <Text>Ajouter</Text>
      </Pressable>
      <Pressable onPress={() => removePurchase(headphones.id)}>
        <Text>Supprimer</Text>
      </Pressable>
    </>
  );
}

async function renderProbe(storage: PurchaseStorage) {
  await render(
    <PurchasesProvider storage={storage}>
      <PurchasesProbe />
    </PurchasesProvider>,
  );
}

describe('PurchasesProvider', () => {
  it('loads the purchases from the storage', async () => {
    await renderProbe(createInMemoryPurchaseStorage([headphones]));

    expect(await screen.findByText('ready : Casque audio')).toBeTruthy();
  });

  it('shares an added purchase', async () => {
    await renderProbe(createInMemoryPurchaseStorage([headphones]));
    await screen.findByText('ready : Casque audio');

    await fireEvent.press(screen.getByText('Ajouter'));

    expect(await screen.findByText('ready : Bouilloire, Casque audio')).toBeTruthy();
  });

  it('shares a removed purchase', async () => {
    await renderProbe(createInMemoryPurchaseStorage([headphones]));
    await screen.findByText('ready : Casque audio');

    await fireEvent.press(screen.getByText('Supprimer'));

    expect(await screen.findByText('ready : ')).toBeTruthy();
  });

  it('reports an error when the storage cannot be read', async () => {
    const brokenStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([]),
      getAll: () => Promise.reject(new Error('read failed')),
    };

    await renderProbe(brokenStorage);

    expect(await screen.findByText('error : ')).toBeTruthy();
  });

  it('lets the caller explain a change that could not be saved', async () => {
    const readOnlyStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([headphones]),
      add: () => Promise.reject(new StorageError('write')),
    };

    function SaveProbe() {
      const { addPurchase } = usePurchases();
      const [message, setMessage] = useState('');

      async function save() {
        try {
          await addPurchase({ name: 'Bouilloire', purchaseDate: '2026-10-02', warrantyMonths: 12 });
        } catch (error) {
          setMessage(getStorageErrorMessage(error));
        }
      }

      return (
        <Pressable onPress={save}>
          <Text>Enregistrer</Text>
          <Text>{message}</Text>
        </Pressable>
      );
    }

    await render(
      <PurchasesProvider storage={readOnlyStorage}>
        <SaveProbe />
      </PurchasesProvider>,
    );
    await fireEvent.press(screen.getByText('Enregistrer'));

    expect(await screen.findByText(WRITE_ERROR_MESSAGE)).toBeTruthy();
  });

  it('shares an updated purchase', async () => {
    function UpdateProbe() {
      const { purchases, updatePurchase } = usePurchases();

      return (
        <Pressable onPress={() => updatePurchase({ ...headphones, name: 'Casque sans fil' })}>
          <Text>Renommer</Text>
          <Text>{purchases.map((purchase) => purchase.name).join(', ')}</Text>
        </Pressable>
      );
    }

    await render(
      <PurchasesProvider storage={createInMemoryPurchaseStorage([headphones])}>
        <UpdateProbe />
      </PurchasesProvider>,
    );
    await screen.findByText('Casque audio');

    await fireEvent.press(screen.getByText('Renommer'));

    expect(await screen.findByText('Casque sans fil')).toBeTruthy();
  });

  it('reads the storage again when asked to reload', async () => {
    let savedPurchases = [headphones];
    const changingStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([]),
      getAll: async () => savedPurchases,
    };

    function ReloadProbe() {
      const { purchases, status, reload } = usePurchases();

      return (
        <Pressable onPress={reload}>
          <Text>Recharger</Text>
          <Text>{`${status} : ${purchases.length}`}</Text>
        </Pressable>
      );
    }

    await render(
      <PurchasesProvider storage={changingStorage}>
        <ReloadProbe />
      </PurchasesProvider>,
    );
    await screen.findByText('ready : 1');

    savedPurchases = [];
    await fireEvent.press(screen.getByText('Recharger'));

    expect(await screen.findByText('ready : 0')).toBeTruthy();
  });

  it('reports an error when the reload fails', async () => {
    let isStorageBroken = false;
    const flakyStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([]),
      getAll: async () => {
        if (isStorageBroken) throw new StorageError('read');
        return [headphones];
      },
    };

    function ReloadProbe() {
      const { status, reload } = usePurchases();

      return (
        <Pressable onPress={reload}>
          <Text>Recharger</Text>
          <Text>{status}</Text>
        </Pressable>
      );
    }

    await render(
      <PurchasesProvider storage={flakyStorage}>
        <ReloadProbe />
      </PurchasesProvider>,
    );
    await screen.findByText('ready');

    isStorageBroken = true;
    await fireEvent.press(screen.getByText('Recharger'));

    expect(await screen.findByText('error')).toBeTruthy();
  });

  it('refuses to be used outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<PurchasesProbe />)).rejects.toThrow(
      'usePurchases must be used inside a PurchasesProvider',
    );
  });
});
