import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { PurchaseInput } from '@/purchases/purchase';
import { getEmptyFormValues, type PurchaseFormValues } from '@/purchases/purchase-validation';
import { StorageError } from '@/storage/purchase-storage';
import { WRITE_ERROR_MESSAGE } from '@/storage/storage-error-message';

import { PurchaseForm } from './purchase-form';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-23';

jest.mock('@/purchases/purchase-date', () => ({
  ...jest.requireActual('@/purchases/purchase-date'),
  getToday: () => '2026-11-23',
}));

const headphonesValues: PurchaseFormValues = {
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: '24',
  price: '349,99',
  category: 'high-tech',
};

type RenderOptions = {
  initialValues?: PurchaseFormValues;
  onSubmit?: (input: PurchaseInput) => Promise<void>;
  onCancel?: () => void;
};

async function renderForm({ initialValues, onSubmit, onCancel }: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseForm
        initialValues={initialValues ?? getEmptyFormValues(TODAY)}
        submitLabel="Enregistrer cet achat"
        onSubmit={onSubmit ?? (async () => {})}
        onCancel={onCancel ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

async function submit() {
  await fireEvent.press(screen.getByText('Enregistrer cet achat'));
}

describe('PurchaseForm', () => {
  it('saves a new purchase with the typed values', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ onSubmit });

    await fireEvent.changeText(screen.getByPlaceholderText('Ex. Casque audio'), 'Bouilloire');
    await fireEvent.changeText(screen.getByPlaceholderText('Ex. 24'), '12');
    await fireEvent.changeText(screen.getByPlaceholderText('Ex. 349,99'), '39,9');
    await submit();

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Bouilloire',
      purchaseDate: TODAY,
      warrantyMonths: 12,
      price: 39.9,
      category: undefined,
    });
  });

  it('shows a message under the name and does not save when the name is missing', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ onSubmit });

    await submit();

    expect(await screen.findByText('Indiquez le nom du produit.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows one message per invalid field', async () => {
    await renderForm({ initialValues: headphonesValues });

    await fireEvent.changeText(screen.getByPlaceholderText('Ex. 24'), '0');
    await fireEvent.changeText(screen.getByPlaceholderText('Ex. 349,99'), 'abc');
    await submit();

    expect(
      await screen.findByText('La durée doit être un nombre entier de mois, supérieur à 0.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Le prix doit être un nombre positif, par exemple 349,99.'),
    ).toBeTruthy();
    expect(screen.queryByText('Indiquez le nom du produit.')).toBeNull();
  });

  it('removes the messages once the fields are corrected', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ onSubmit });
    await submit();
    await screen.findByText('Indiquez le nom du produit.');

    await fireEvent.changeText(screen.getByPlaceholderText('Ex. Casque audio'), 'Bouilloire');
    await submit();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Indiquez le nom du produit.')).toBeNull();
  });

  it('fills the fields with an existing purchase and saves the changes', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ initialValues: headphonesValues, onSubmit });

    expect(screen.getByDisplayValue('Casque audio')).toBeTruthy();
    expect(screen.getByDisplayValue('349,99')).toBeTruthy();

    await fireEvent.changeText(screen.getByDisplayValue('Casque audio'), 'Casque sans fil');
    await submit();

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Casque sans fil',
      purchaseDate: '2026-11-18',
      warrantyMonths: 24,
      price: 349.99,
      category: 'high-tech',
    });
  });

  it('explains the error and stays open when the purchase cannot be saved', async () => {
    const onSubmit = jest.fn(() => Promise.reject(new StorageError('write')));
    await renderForm({ initialValues: headphonesValues, onSubmit });

    await submit();

    expect(await screen.findByText(WRITE_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.getByDisplayValue('Casque audio')).toBeTruthy();
  });

  it('lets the user cancel without saving', async () => {
    const onSubmit = jest.fn(async () => {});
    const onCancel = jest.fn();
    await renderForm({ onSubmit, onCancel });

    await fireEvent.press(screen.getByText('Annuler'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves the category chosen by the user', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ onSubmit });

    await fireEvent.changeText(screen.getByPlaceholderText('Ex. Casque audio'), 'Bouilloire');
    await fireEvent.press(screen.getByText('Cuisine'));
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'kitchen' }));
  });

  it('replaces the category when another one is chosen', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ initialValues: headphonesValues, onSubmit });

    await fireEvent.press(screen.getByText('Maison'));
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'home' }));
  });

  it('saves the purchase date picked in the calendar', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({ initialValues: headphonesValues, onSubmit });

    await fireEvent.press(screen.getByLabelText('Date d’achat : 18 novembre 2026'));
    await fireEvent(screen.getByTestId('date-field-calendar'), 'change', {
      nativeEvent: { timestamp: new Date(2026, 9, 2).getTime() },
    });
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ purchaseDate: '2026-10-02' }));
  });

  it('refuses a purchase date after today', async () => {
    const onSubmit = jest.fn(async () => {});
    await renderForm({
      initialValues: { ...headphonesValues, purchaseDate: '2026-11-24' },
      onSubmit,
    });

    await submit();

    expect(await screen.findByText('La date d’achat ne peut pas être dans le futur.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
