import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EditPurchaseScreen from '@/app/purchases/[id]/edit';
import NewPurchaseScreen from '@/app/purchases/new';
import { notifySuccess } from '@/native/haptics';
import type { Purchase } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { StorageError, type PurchaseStorage } from '@/storage/purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';
import { WRITE_ERROR_MESSAGE } from '@/storage/storage-error-message';

const mockBack = jest.fn();
let mockRouteParams: { id: string } = { id: 'headphones' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('@/native/haptics', () => ({
  notifySuccess: jest.fn(async () => {}),
}));

// Fixed reference date: the tests never depend on the day they run.
jest.mock('@/purchases/purchase-date', () => ({
  ...jest.requireActual('@/purchases/purchase-date'),
  getToday: () => '2026-11-24',
}));

// The confirmation message is placed with the safe area, which Expo Router provides in the app.
const SCREEN_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
  price: 349.99,
  category: 'high-tech',
  receiptFileName: 'receipt-headphones.jpg',
};

async function renderScreen(screenElement: ReactElement, storage: PurchaseStorage) {
  await render(
    <SafeAreaProvider initialMetrics={SCREEN_METRICS}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <PurchasesProvider storage={storage}>{screenElement}</PurchasesProvider>
      </HeroUINativeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockClear();
  jest.mocked(notifySuccess).mockClear();
  mockRouteParams = { id: 'headphones' };
});

describe('NewPurchaseScreen', () => {
  it('saves the purchase, vibrates, then goes back', async () => {
    const storage = createInMemoryPurchaseStorage([]);
    await renderScreen(<NewPurchaseScreen />, storage);

    await fireEvent.changeText(
      await screen.findByPlaceholderText('Ex. Casque audio'),
      'Bouilloire',
    );
    await fireEvent.press(screen.getByText('Enregistrer cet achat'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(notifySuccess).toHaveBeenCalledTimes(1);
    expect(await storage.getAll()).toEqual([
      {
        id: expect.any(String),
        name: 'Bouilloire',
        purchaseDate: '2026-11-24',
        warrantyMonths: 24,
        price: undefined,
        category: undefined,
      },
    ]);
  });

  it('stays open and saves nothing when the form is invalid', async () => {
    const storage = createInMemoryPurchaseStorage([]);
    await renderScreen(<NewPurchaseScreen />, storage);

    await fireEvent.press(await screen.findByText('Enregistrer cet achat'));

    expect(await screen.findByText('Indiquez le nom du produit.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(await storage.getAll()).toEqual([]);
  });

  it('explains a storage error, without vibration and without leaving the form', async () => {
    const readOnlyStorage: PurchaseStorage = {
      ...createInMemoryPurchaseStorage([]),
      add: () => Promise.reject(new StorageError('write')),
    };
    await renderScreen(<NewPurchaseScreen />, readOnlyStorage);

    await fireEvent.changeText(
      await screen.findByPlaceholderText('Ex. Casque audio'),
      'Bouilloire',
    );
    await fireEvent.press(screen.getByText('Enregistrer cet achat'));

    expect(await screen.findByText(WRITE_ERROR_MESSAGE)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it('goes back without saving when the user cancels', async () => {
    const storage = createInMemoryPurchaseStorage([]);
    await renderScreen(<NewPurchaseScreen />, storage);

    await fireEvent.changeText(
      await screen.findByPlaceholderText('Ex. Casque audio'),
      'Bouilloire',
    );
    await fireEvent.press(screen.getByText('Annuler'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(await storage.getAll()).toEqual([]);
  });
});

describe('EditPurchaseScreen', () => {
  it('fills the form with the purchase to edit', async () => {
    await renderScreen(<EditPurchaseScreen />, createInMemoryPurchaseStorage([headphones]));

    expect(await screen.findByDisplayValue('Casque audio')).toBeTruthy();
    expect(screen.getByDisplayValue('24')).toBeTruthy();
    expect(screen.getByDisplayValue('349,99')).toBeTruthy();
    expect(screen.getByDisplayValue('18 novembre 2026')).toBeTruthy();
  });

  it('saves the changes and keeps the id and the receipt photo', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);
    await renderScreen(<EditPurchaseScreen />, storage);

    await fireEvent.changeText(await screen.findByDisplayValue('Casque audio'), 'Casque sans fil');
    await fireEvent.press(screen.getByText('Enregistrer les modifications'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(notifySuccess).toHaveBeenCalledTimes(1);
    expect(await storage.getAll()).toEqual([{ ...headphones, name: 'Casque sans fil' }]);
  });

  it('can remove the price of a purchase', async () => {
    const storage = createInMemoryPurchaseStorage([headphones]);
    await renderScreen(<EditPurchaseScreen />, storage);

    await fireEvent.changeText(await screen.findByDisplayValue('349,99'), '');
    await fireEvent.press(screen.getByText('Enregistrer les modifications'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    const [savedPurchase] = await storage.getAll();
    expect(savedPurchase.price).toBeUndefined();
    expect(savedPurchase.receiptFileName).toBe('receipt-headphones.jpg');
  });

  it('says that the purchase cannot be found when its id is unknown', async () => {
    mockRouteParams = { id: 'unknown' };
    await renderScreen(<EditPurchaseScreen />, createInMemoryPurchaseStorage([headphones]));

    expect(await screen.findByText('Cet achat est introuvable.')).toBeTruthy();
    expect(screen.queryByText('Enregistrer les modifications')).toBeNull();
  });
});
