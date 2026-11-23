import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Text } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { StorageError, type PurchaseStorage } from '@/storage/purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';
import { READ_ERROR_MESSAGE } from '@/storage/storage-error-message';

import { PurchasesGate } from './purchases-gate';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

async function renderGate(storage: PurchaseStorage) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchasesProvider storage={storage}>
        <PurchasesGate>
          <Text>Écrans de l’application</Text>
        </PurchasesGate>
      </PurchasesProvider>
    </HeroUINativeProvider>,
  );
}

describe('PurchasesGate', () => {
  it('shows the screens once the purchases are loaded', async () => {
    await renderGate(createInMemoryPurchaseStorage([headphones]));

    expect(await screen.findByText('Écrans de l’application')).toBeTruthy();
  });

  it('explains a loading error and hides the screens', async () => {
    const brokenStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([headphones]),
      getAll: () => Promise.reject(new StorageError('read')),
    };

    await renderGate(brokenStorage);

    expect(await screen.findByText('Chargement impossible')).toBeTruthy();
    expect(screen.getByText(READ_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('Écrans de l’application')).toBeNull();
  });

  it('loads again when the user presses « Réessayer »', async () => {
    let isStorageBroken = true;
    const flakyStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([headphones]),
      getAll: async () => {
        if (isStorageBroken) throw new StorageError('read');
        return [headphones];
      },
    };
    await renderGate(flakyStorage);
    await screen.findByText('Chargement impossible');

    isStorageBroken = false;
    await fireEvent.press(screen.getByText('Réessayer'));

    expect(await screen.findByText('Écrans de l’application')).toBeTruthy();
  });
});
