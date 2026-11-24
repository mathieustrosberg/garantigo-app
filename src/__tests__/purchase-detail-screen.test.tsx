import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PurchaseDetailScreen from '@/app/purchases/[id]';
import { notifySuccess } from '@/native/haptics';
import { getReceiptPhotoUri } from '@/native/receipt-photos';
import type { Purchase } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'headphones' }),
}));

jest.mock('@/native/haptics', () => ({
  notifySuccess: jest.fn(async () => {}),
}));

// The phone's files do not exist in Jest: the photo address is decided by each test.
jest.mock('@/native/receipt-photos', () => ({
  getReceiptPhotoUri: jest.fn(),
}));

// Fixed reference date: the tests never depend on the day they run.
jest.mock('@/purchases/purchase-date', () => ({
  ...jest.requireActual('@/purchases/purchase-date'),
  getToday: () => '2026-11-24',
}));

// The success message is placed with the safe area, which Expo Router provides in the app.
const SCREEN_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const PHOTO_URI = 'file:///documents/receipts/receipt-headphones.jpg';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
  receiptFileName: 'receipt-headphones.jpg',
};

async function renderScreen() {
  await render(
    <SafeAreaProvider initialMetrics={SCREEN_METRICS}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <PurchasesProvider storage={createInMemoryPurchaseStorage([headphones])}>
          <PurchaseDetailScreen />
        </PurchasesProvider>
      </HeroUINativeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockClear();
  jest.mocked(getReceiptPhotoUri).mockReturnValue(PHOTO_URI);
});

describe('PurchaseDetailScreen after a deletion', () => {
  it('keeps showing the purchase while the screen goes back', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    // The vibration stays unfinished, like the moment the screen starts to go back.
    let finishVibration = () => {};
    jest
      .mocked(notifySuccess)
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finishVibration = resolve)));
    await renderScreen();

    await fireEvent.press(await screen.findByText('Supprimer'));
    // From now on, the photo is gone from the phone.
    jest.mocked(getReceiptPhotoUri).mockReturnValue(undefined);
    const buttons: AlertButton[] = alert.mock.calls[0][2] ?? [];
    buttons.find((button) => button.text === 'Supprimer')?.onPress?.();

    await waitFor(() => expect(notifySuccess).toHaveBeenCalled());
    expect(screen.queryByText('Cet achat est introuvable.')).toBeNull();
    expect(screen.queryByText('La photo du ticket est introuvable sur ce téléphone.')).toBeNull();
    expect(screen.getByText('Casque audio')).toBeTruthy();

    finishVibration();
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    alert.mockRestore();
  });
});
