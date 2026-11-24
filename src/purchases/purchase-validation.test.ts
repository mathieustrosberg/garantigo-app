import type { Purchase } from './purchase';
import {
  getEmptyFormValues,
  toFormValues,
  validatePurchaseForm,
  type PurchaseFormErrors,
  type PurchaseFormValues,
} from './purchase-validation';

const TODAY = '2026-11-23';

const validValues: PurchaseFormValues = {
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: '24',
  price: '349,99',
  category: 'high-tech',
  receiptFileName: undefined,
};

function getErrors(changes: Partial<PurchaseFormValues>): PurchaseFormErrors {
  const result = validatePurchaseForm({ ...validValues, ...changes }, TODAY);
  return result.isValid ? {} : result.errors;
}

describe('validatePurchaseForm with valid values', () => {
  it('returns the purchase to save, with numbers instead of text', () => {
    expect(validatePurchaseForm(validValues, TODAY)).toEqual({
      isValid: true,
      input: {
        name: 'Casque audio',
        purchaseDate: '2026-11-18',
        warrantyMonths: 24,
        price: 349.99,
        category: 'high-tech',
      },
    });
  });

  it('keeps the name of the receipt photo', () => {
    const result = validatePurchaseForm(
      { ...validValues, receiptFileName: 'receipt-1.jpg' },
      TODAY,
    );

    expect(result).toMatchObject({ isValid: true, input: { receiptFileName: 'receipt-1.jpg' } });
  });

  it('removes the spaces around the name', () => {
    const result = validatePurchaseForm({ ...validValues, name: '  Casque audio  ' }, TODAY);

    expect(result).toMatchObject({ isValid: true, input: { name: 'Casque audio' } });
  });

  it('accepts a purchase without price and without category', () => {
    const result = validatePurchaseForm({ ...validValues, price: '', category: undefined }, TODAY);

    expect(result).toMatchObject({
      isValid: true,
      input: { price: undefined, category: undefined },
    });
  });

  it.each([
    ['349.99', 349.99],
    ['349,9', 349.9],
    ['0', 0],
    ['1200', 1200],
  ])('reads the price "%s" as %d', (price, expected) => {
    const result = validatePurchaseForm({ ...validValues, price }, TODAY);

    expect(result).toMatchObject({ isValid: true, input: { price: expected } });
  });

  it('accepts a purchase made today', () => {
    expect(getErrors({ purchaseDate: TODAY })).toEqual({});
  });
});

describe('validatePurchaseForm with invalid values', () => {
  it.each(['', '   '])('requires a name (typed: "%s")', (name) => {
    expect(getErrors({ name })).toEqual({ name: 'Indiquez le nom du produit.' });
  });

  it.each(['', '18/11/2026', '2026-02-30'])(
    'requires a real purchase date (typed: "%s")',
    (date) => {
      expect(getErrors({ purchaseDate: date })).toEqual({
        purchaseDate: 'Choisissez une date d’achat valide.',
      });
    },
  );

  it('refuses a purchase date after today', () => {
    expect(getErrors({ purchaseDate: '2026-11-24' })).toEqual({
      purchaseDate: 'La date d’achat ne peut pas être dans le futur.',
    });
  });

  it('requires a warranty duration', () => {
    expect(getErrors({ warrantyMonths: '' })).toEqual({
      warrantyMonths: 'Indiquez la durée de garantie en mois.',
    });
  });

  it.each(['0', '-12', '1,5', '12.5', 'douze', '12 mois'])(
    'refuses the warranty duration "%s"',
    (warrantyMonths) => {
      expect(getErrors({ warrantyMonths })).toEqual({
        warrantyMonths: 'La durée doit être un nombre entier de mois, supérieur à 0.',
      });
    },
  );

  it.each(['-5', 'abc', '12,345', '12,', '1 200', '12€'])('refuses the price "%s"', (price) => {
    expect(getErrors({ price })).toEqual({
      price: 'Le prix doit être un nombre positif, par exemple 349,99.',
    });
  });

  it('reports every invalid field at once', () => {
    const errors = getErrors({ name: '', purchaseDate: '', warrantyMonths: '', price: 'abc' });

    expect(Object.keys(errors).sort()).toEqual(['name', 'price', 'purchaseDate', 'warrantyMonths']);
  });
});

describe('form values', () => {
  it('starts an empty form on today, with a 24-month warranty', () => {
    expect(getEmptyFormValues(TODAY)).toEqual({
      name: '',
      purchaseDate: TODAY,
      warrantyMonths: '24',
      price: '',
      category: undefined,
      receiptFileName: undefined,
    });
  });

  it('fills the form from an existing purchase', () => {
    const purchase: Purchase = {
      id: 'headphones',
      name: 'Casque audio',
      purchaseDate: '2026-11-18',
      warrantyMonths: 24,
      price: 349.9,
      category: 'high-tech',
      receiptFileName: 'receipt-1.jpg',
    };

    expect(toFormValues(purchase)).toEqual({
      name: 'Casque audio',
      purchaseDate: '2026-11-18',
      warrantyMonths: '24',
      price: '349,9',
      category: 'high-tech',
      receiptFileName: 'receipt-1.jpg',
    });
  });

  it('leaves the price empty when the purchase has none', () => {
    const purchase: Purchase = {
      id: 'kettle',
      name: 'Bouilloire',
      purchaseDate: '2026-10-02',
      warrantyMonths: 12,
    };

    expect(toFormValues(purchase)).toMatchObject({ price: '', category: undefined });
  });

  it('produces values that pass validation again', () => {
    const purchase: Purchase = {
      id: 'headphones',
      name: 'Casque audio',
      purchaseDate: '2026-11-18',
      warrantyMonths: 24,
      price: 349.9,
    };

    expect(validatePurchaseForm(toFormValues(purchase), TODAY)).toMatchObject({ isValid: true });
  });
});
