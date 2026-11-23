import { formatStoredDate, fromStoredDate, isStoredDate, toStoredDate } from './purchase-date';

describe('toStoredDate', () => {
  it('formats the local day with leading zeros', () => {
    expect(toStoredDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toStoredDate(new Date(2026, 10, 23))).toBe('2026-11-23');
  });

  it('keeps the local day even late in the evening', () => {
    expect(toStoredDate(new Date(2026, 10, 23, 23, 59, 59))).toBe('2026-11-23');
  });
});

describe('fromStoredDate', () => {
  it('returns the local date at midnight', () => {
    const date = fromStoredDate('2026-11-23');

    expect(date).toEqual(new Date(2026, 10, 23));
  });

  it('gives back the same text after a round trip', () => {
    const date = fromStoredDate('2024-02-29');

    expect(date).not.toBeNull();
    expect(toStoredDate(date as Date)).toBe('2024-02-29');
  });

  it.each(['', '23/11/2026', '2026-1-5', '2026-11-23T10:00:00', 'hello'])(
    'rejects the badly formatted text "%s"',
    (value) => {
      expect(fromStoredDate(value)).toBeNull();
    },
  );

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026-04-31'])(
    'rejects the date %s, which does not exist',
    (value) => {
      expect(fromStoredDate(value)).toBeNull();
    },
  );
});

describe('isStoredDate', () => {
  it('accepts a real date and rejects anything else', () => {
    expect(isStoredDate('2024-02-29')).toBe(true);
    expect(isStoredDate('2025-02-29')).toBe(false);
  });
});

describe('formatStoredDate', () => {
  it('writes the date in French', () => {
    expect(formatStoredDate('2026-11-18')).toBe('18 novembre 2026');
    expect(formatStoredDate('2024-02-29')).toBe('29 février 2024');
  });

  it('shows the text unchanged when it is not a real date', () => {
    expect(formatStoredDate('2026-02-30')).toBe('2026-02-30');
  });
});
