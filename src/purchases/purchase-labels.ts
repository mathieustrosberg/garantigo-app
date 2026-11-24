import type { PurchaseCategory } from './purchase';

/** Category names shown to the user. */
export const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  'high-tech': 'High-tech',
  home: 'Maison',
  kitchen: 'Cuisine',
  other: 'Autre',
};

const PRICE_FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/** Writes a price in euros the French way, for example '349,99 €'. */
export function formatPrice(price: number): string {
  return PRICE_FORMAT.format(price);
}
