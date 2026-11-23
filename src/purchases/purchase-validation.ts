import type { Purchase, PurchaseCategory, PurchaseInput } from './purchase';
import { isStoredDate } from './purchase-date';

/** What the user typed: text fields stay text until they are validated. */
export type PurchaseFormValues = {
  name: string;
  purchaseDate: string;
  warrantyMonths: string;
  price: string;
  category: PurchaseCategory | undefined;
};

export type PurchaseFormField = 'name' | 'purchaseDate' | 'warrantyMonths' | 'price';

export type PurchaseFormErrors = Partial<Record<PurchaseFormField, string>>;

export type PurchaseFormResult =
  { isValid: true; input: PurchaseInput } | { isValid: false; errors: PurchaseFormErrors };

const WHOLE_NUMBER_FORMAT = /^\d+$/;
// Up to two decimals, written with a comma (French keyboard) or a dot.
const PRICE_FORMAT = /^\d+([.,]\d{1,2})?$/;

export function getEmptyFormValues(today: string): PurchaseFormValues {
  return { name: '', purchaseDate: today, warrantyMonths: '24', price: '', category: undefined };
}

export function toFormValues(purchase: Purchase): PurchaseFormValues {
  return {
    name: purchase.name,
    purchaseDate: purchase.purchaseDate,
    warrantyMonths: String(purchase.warrantyMonths),
    price: purchase.price === undefined ? '' : String(purchase.price).replace('.', ','),
    category: purchase.category,
  };
}

/** `today` is a parameter so that tests do not depend on the real date. */
export function validatePurchaseForm(
  values: PurchaseFormValues,
  today: string,
): PurchaseFormResult {
  const name = values.name.trim();
  const warrantyMonths = values.warrantyMonths.trim();
  const price = values.price.trim();
  const errors: PurchaseFormErrors = {};

  if (name === '') {
    errors.name = 'Indiquez le nom du produit.';
  }

  if (!isStoredDate(values.purchaseDate)) {
    errors.purchaseDate = 'Choisissez une date d’achat valide.';
  } else if (values.purchaseDate > today) {
    errors.purchaseDate = 'La date d’achat ne peut pas être dans le futur.';
  }

  if (warrantyMonths === '') {
    errors.warrantyMonths = 'Indiquez la durée de garantie en mois.';
  } else if (!WHOLE_NUMBER_FORMAT.test(warrantyMonths) || Number(warrantyMonths) === 0) {
    errors.warrantyMonths = 'La durée doit être un nombre entier de mois, supérieur à 0.';
  }

  if (price !== '' && !PRICE_FORMAT.test(price)) {
    errors.price = 'Le prix doit être un nombre positif, par exemple 349,99.';
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    input: {
      name,
      purchaseDate: values.purchaseDate,
      warrantyMonths: Number(warrantyMonths),
      price: price === '' ? undefined : Number(price.replace(',', '.')),
      category: values.category,
    },
  };
}
