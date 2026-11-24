import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import type { Purchase } from '@/purchases/purchase';

import { createInMemoryPurchaseStorage } from './in-memory-purchase-storage';
import type { PurchaseStorage } from './purchase-storage';
import { PurchasesProvider, usePurchases } from './purchases-context';

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

  it('refuses to be used outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<PurchasesProbe />)).rejects.toThrow(
      'usePurchases must be used inside a PurchasesProvider',
    );
  });
});
