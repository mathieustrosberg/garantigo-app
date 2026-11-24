import type { Purchase } from './purchase';

/** Lower case, without accents, so that 'cafe' finds 'Machine à café'. */
function simplify(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Keeps the purchases whose name contains the searched text.
 * Upper case, accents and surrounding spaces are ignored. An empty search keeps everything.
 */
export function searchPurchases(purchases: Purchase[], query: string): Purchase[] {
  const searchedText = simplify(query);
  if (searchedText === '') return purchases;

  return purchases.filter((purchase) => simplify(purchase.name).includes(searchedText));
}
