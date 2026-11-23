export type PurchaseCategory = 'high-tech' | 'home' | 'kitchen' | 'other';

export type Purchase = {
  id: string;
  name: string;
  /** Date without time, formatted as 'YYYY-MM-DD', so it never shifts with the time zone. */
  purchaseDate: string;
  /** Warranty duration in months: a whole number greater than 0. */
  warrantyMonths: number;
  /** Price in euros. */
  price?: number;
  category?: PurchaseCategory;
  /** Name of the receipt photo inside the receipts folder, never an absolute path. */
  receiptFileName?: string;
};

/** A purchase as typed in the form, before the storage gives it an id. */
export type PurchaseInput = Omit<Purchase, 'id'>;

export function createPurchaseId(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${timePart}-${randomPart}`;
}
