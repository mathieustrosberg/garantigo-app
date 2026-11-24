import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Linking } from 'react-native';

import { RECEIPT_PHOTO_MESSAGES, takeReceiptPhoto } from '@/native/receipt-photos';

import { ReceiptPhotoField } from './receipt-photo-field';

// The camera and the phone's files do not exist in Jest: the native helpers are replaced.
jest.mock('@/native/receipt-photos', () => ({
  ...jest.requireActual('@/native/receipt-photos'),
  takeReceiptPhoto: jest.fn(),
  getReceiptPhotoUri: (fileName: string) =>
    fileName === 'receipt-lost.jpg' ? undefined : `file:///documents/receipts/${fileName}`,
}));

const takePhoto = jest.mocked(takeReceiptPhoto);

async function renderField(fileName: string | undefined, onChange = jest.fn()) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <ReceiptPhotoField fileName={fileName} onChange={onChange} />
    </HeroUINativeProvider>,
  );
  return onChange;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReceiptPhotoField', () => {
  it('offers to take a photo when there is none', async () => {
    takePhoto.mockResolvedValue({ status: 'taken', fileName: 'receipt-new.jpg' });
    const onChange = await renderField(undefined);

    await fireEvent.press(screen.getByText('Photographier le ticket'));

    expect(onChange).toHaveBeenCalledWith('receipt-new.jpg');
  });

  it('shows the preview with "Reprendre" and "Retirer"', async () => {
    await renderField('receipt-1.jpg');

    expect(screen.getByLabelText('Aperçu de la photo du ticket')).toBeTruthy();
    expect(screen.getByText('Reprendre')).toBeTruthy();
    expect(screen.queryByText('Photographier le ticket')).toBeNull();
  });

  it('replaces the photo with a new one', async () => {
    takePhoto.mockResolvedValue({ status: 'taken', fileName: 'receipt-2.jpg' });
    const onChange = await renderField('receipt-1.jpg');

    await fireEvent.press(screen.getByText('Reprendre'));

    expect(onChange).toHaveBeenCalledWith('receipt-2.jpg');
  });

  it('removes the photo', async () => {
    const onChange = await renderField('receipt-1.jpg');

    await fireEvent.press(screen.getByText('Retirer'));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('changes nothing when the user closes the camera', async () => {
    takePhoto.mockResolvedValue({ status: 'cancelled' });
    const onChange = await renderField(undefined);

    await fireEvent.press(screen.getByText('Photographier le ticket'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText(RECEIPT_PHOTO_MESSAGES.failed)).toBeNull();
  });

  it('explains a refused permission and opens the settings', async () => {
    takePhoto.mockResolvedValue({ status: 'permissionDenied' });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const onChange = await renderField(undefined);

    await fireEvent.press(screen.getByText('Photographier le ticket'));
    expect(await screen.findByText(RECEIPT_PHOTO_MESSAGES.permissionDenied)).toBeTruthy();
    await fireEvent.press(screen.getByText('Ouvrir les Réglages'));

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('explains when the photo could not be saved', async () => {
    takePhoto.mockResolvedValue({ status: 'failed' });
    await renderField(undefined);

    await fireEvent.press(screen.getByText('Photographier le ticket'));

    expect(await screen.findByText(RECEIPT_PHOTO_MESSAGES.failed)).toBeTruthy();
    expect(screen.queryByText('Ouvrir les Réglages')).toBeNull();
  });

  it('says when the photo is no longer on the phone', async () => {
    await renderField('receipt-lost.jpg');

    expect(screen.getByText('La photo du ticket est introuvable sur ce téléphone.')).toBeTruthy();
  });
});
