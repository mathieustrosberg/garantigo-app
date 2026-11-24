import { CATEGORY_LABELS, formatPrice } from './purchase-labels';

// Intl separates the amount and the euro sign with a narrow no-break space.
function withPlainSpaces(text: string): string {
  return text.replace(/\s/g, ' ');
}

describe('formatPrice', () => {
  it('writes the price with a decimal comma and the euro sign', () => {
    expect(withPlainSpaces(formatPrice(349.99))).toBe('349,99 €');
  });

  it('always shows two decimals', () => {
    expect(withPlainSpaces(formatPrice(1199))).toBe('1 199,00 €');
    expect(withPlainSpaces(formatPrice(159.9))).toBe('159,90 €');
  });
});

describe('CATEGORY_LABELS', () => {
  it('names every category in French', () => {
    expect(CATEGORY_LABELS).toEqual({
      'high-tech': 'High-tech',
      home: 'Maison',
      kitchen: 'Cuisine',
      other: 'Autre',
    });
  });
});
