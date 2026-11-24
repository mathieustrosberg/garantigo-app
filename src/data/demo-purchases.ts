import type { Purchase } from '@/purchases/purchase';

import demoPurchasesJson from './demo-purchases.json';

// JSON has no union types: `category` is read as a plain string, so the cast is needed.
// The shape of the file is checked by demo-purchases.test.ts.
export const demoPurchases = demoPurchasesJson as Purchase[];
