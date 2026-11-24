import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';
import { StorageError } from '@/storage/purchase-storage';
import { WRITE_ERROR_MESSAGE } from '@/storage/storage-error-message';

import { PurchaseDetail } from './purchase-detail';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-24';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
  price: 349.99,
  category: 'high-tech',
};

async function renderDetail(
  purchase: Purchase,
  {
    onEdit = () => {},
    onDelete = async () => {},
    receiptUri,
  }: { onEdit?: () => void; onDelete?: () => Promise<void>; receiptUri?: string } = {},
) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseDetail
        purchase={purchase}
        today={TODAY}
        receiptUri={receiptUri}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseDetail', () => {
  it('shows the end of the warranty, the days left and the status', async () => {
    await renderDetail(headphones);

    expect(screen.getByText('Casque audio')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('18 novembre 2028')).toBeTruthy();
    expect(screen.getByText('725 jours restants')).toBeTruthy();
  });

  it('shows every piece of information of the purchase', async () => {
    await renderDetail(headphones);

    expect(screen.getByLabelText('Date d’achat : 18 novembre 2026')).toBeTruthy();
    expect(screen.getByLabelText('Durée de garantie : 24 mois')).toBeTruthy();
    expect(screen.getByLabelText(/^Prix : 349,99\s€$/)).toBeTruthy();
    expect(screen.getByLabelText('Catégorie : High-tech')).toBeTruthy();
  });

  it('says when the price and the category are missing', async () => {
    await renderDetail({
      id: 'lamp',
      name: 'Lampe',
      purchaseDate: '2026-11-18',
      warrantyMonths: 12,
    });

    expect(screen.getByLabelText('Prix : Non renseigné')).toBeTruthy();
    expect(screen.getByLabelText('Catégorie : Non renseignée')).toBeTruthy();
  });

  it('still shows the days when the warranty has expired', async () => {
    await renderDetail({ ...headphones, purchaseDate: '2023-04-10' });

    expect(screen.getByText('Expirée')).toBeTruthy();
    expect(screen.getByText('10 avril 2025')).toBeTruthy();
    expect(screen.getByText('Expirée depuis 593 jours')).toBeTruthy();
  });

  it('warns on the last day of the warranty', async () => {
    await renderDetail({ ...headphones, purchaseDate: '2024-11-24' });

    expect(screen.getByText('Expire bientôt')).toBeTruthy();
    expect(screen.getByText('Dernier jour de garantie')).toBeTruthy();
  });

  it('opens the form from the edit button', async () => {
    const onEdit = jest.fn();
    await renderDetail(headphones, { onEdit });

    await fireEvent.press(screen.getByText('Modifier'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows the receipt photo', async () => {
    await renderDetail(
      { ...headphones, receiptFileName: 'receipt-1.jpg' },
      { receiptUri: 'file:///documents/receipts/receipt-1.jpg' },
    );

    expect(screen.getByLabelText('Photo du ticket de caisse')).toBeTruthy();
  });

  it('says when the purchase has no receipt photo', async () => {
    await renderDetail(headphones);

    expect(screen.getByText('Aucune photo du ticket')).toBeTruthy();
    expect(screen.queryByLabelText('Photo du ticket de caisse')).toBeNull();
  });

  it('says when the receipt photo is missing from the phone', async () => {
    await renderDetail({ ...headphones, receiptFileName: 'receipt-1.jpg' });

    expect(screen.getByText('La photo du ticket est introuvable sur ce téléphone.')).toBeTruthy();
  });

  describe('deletion', () => {
    let alert: jest.SpyInstance;

    beforeEach(() => {
      alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      alert.mockRestore();
    });

    /** Presses one of the buttons of the confirmation shown by Alert.alert. */
    async function answerConfirmation(text: string) {
      const buttons: AlertButton[] = alert.mock.calls[0][2];
      await buttons.find((button) => button.text === text)?.onPress?.();
    }

    it('asks for a confirmation before deleting', async () => {
      const onDelete = jest.fn(async () => {});
      await renderDetail(headphones, { onDelete });

      await fireEvent.press(screen.getByText('Supprimer'));

      expect(alert).toHaveBeenCalledWith(
        'Supprimer cet achat ?',
        '« Casque audio » sera supprimé. Cette action est définitive.',
        expect.any(Array),
      );
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('warns that the receipt photo will be deleted too', async () => {
      await renderDetail({ ...headphones, receiptFileName: 'receipt-1.jpg' });

      await fireEvent.press(screen.getByText('Supprimer'));

      expect(alert.mock.calls[0][1]).toBe(
        '« Casque audio » et la photo de son ticket seront supprimés. Cette action est définitive.',
      );
    });

    it('deletes the purchase once confirmed', async () => {
      const onDelete = jest.fn(async () => {});
      await renderDetail(headphones, { onDelete });

      await fireEvent.press(screen.getByText('Supprimer'));
      await answerConfirmation('Supprimer');

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('keeps the purchase when the user cancels', async () => {
      const onDelete = jest.fn(async () => {});
      await renderDetail(headphones, { onDelete });

      await fireEvent.press(screen.getByText('Supprimer'));
      await answerConfirmation('Annuler');

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('explains the error when the purchase cannot be deleted', async () => {
      const onDelete = jest.fn(() => Promise.reject(new StorageError('write')));
      await renderDetail(headphones, { onDelete });

      await fireEvent.press(screen.getByText('Supprimer'));
      await answerConfirmation('Supprimer');

      expect(await screen.findByText(WRITE_ERROR_MESSAGE)).toBeTruthy();
      expect(screen.getByText('Supprimer')).toBeTruthy();
    });
  });
});
