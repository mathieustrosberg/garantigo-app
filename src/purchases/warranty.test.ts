import {
  EXPIRING_SOON_DAYS,
  getRemainingDays,
  getWarranty,
  getWarrantyEndDate,
  getWarrantyStatus,
} from './warranty';

describe('getWarrantyEndDate', () => {
  it('adds the duration in months to the purchase date', () => {
    expect(getWarrantyEndDate('2026-01-15', 1)).toBe('2026-02-15');
    expect(getWarrantyEndDate('2026-03-10', 24)).toBe('2028-03-10');
  });

  it('moves to the next year when the months go past December', () => {
    expect(getWarrantyEndDate('2026-11-23', 2)).toBe('2027-01-23');
    expect(getWarrantyEndDate('2026-12-31', 12)).toBe('2027-12-31');
  });

  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2026-01-30', 1, '2026-02-28'],
    ['2026-03-31', 1, '2026-04-30'],
    ['2026-08-31', 6, '2027-02-28'],
    ['2026-05-31', 4, '2026-09-30'],
  ])(
    'uses the last day of the month when %s + %i months does not exist',
    (purchaseDate, months, endDate) => {
      expect(getWarrantyEndDate(purchaseDate, months)).toBe(endDate);
    },
  );

  it.each([
    ['2028-01-31', 1, '2028-02-29'],
    ['2028-02-29', 12, '2029-02-28'],
    ['2028-02-29', 48, '2032-02-29'],
    ['2027-02-28', 12, '2028-02-28'],
  ])('handles leap years: %s + %i months', (purchaseDate, months, endDate) => {
    expect(getWarrantyEndDate(purchaseDate, months)).toBe(endDate);
  });

  it.each([
    ['2026-11-23', 60, '2031-11-23'],
    ['2026-11-23', 120, '2036-11-23'],
    ['2024-01-31', 121, '2034-02-28'],
  ])('handles long durations: %s + %i months', (purchaseDate, months, endDate) => {
    expect(getWarrantyEndDate(purchaseDate, months)).toBe(endDate);
  });

  it('rejects a purchase date that does not exist', () => {
    expect(() => getWarrantyEndDate('2026-02-30', 12)).toThrow('Invalid date');
  });

  it.each([0, -3, 1.5, Number.NaN])('rejects the duration %p', (months) => {
    expect(() => getWarrantyEndDate('2026-11-23', months)).toThrow('Invalid warranty duration');
  });
});

describe('getRemainingDays', () => {
  it('returns 0 on the end date', () => {
    expect(getRemainingDays('2026-11-24', '2026-11-24')).toBe(0);
  });

  it('counts the days left before the end date', () => {
    expect(getRemainingDays('2026-11-25', '2026-11-24')).toBe(1);
    expect(getRemainingDays('2027-01-01', '2026-12-01')).toBe(31);
  });

  it('is negative once the end date has passed', () => {
    expect(getRemainingDays('2026-11-23', '2026-11-24')).toBe(-1);
    expect(getRemainingDays('2025-11-24', '2026-11-24')).toBe(-365);
  });

  it('counts February 29 in leap years', () => {
    expect(getRemainingDays('2028-03-01', '2028-02-28')).toBe(2);
    expect(getRemainingDays('2029-03-01', '2028-03-01')).toBe(365);
    expect(getRemainingDays('2028-03-01', '2027-03-01')).toBe(366);
  });

  it('is not shifted by daylight saving time changes', () => {
    // In France, clocks change on March 29 and October 25, 2026.
    expect(getRemainingDays('2026-03-30', '2026-03-28')).toBe(2);
    expect(getRemainingDays('2026-10-26', '2026-10-24')).toBe(2);
  });

  it('rejects a day that does not exist', () => {
    expect(() => getRemainingDays('2026-11-31', '2026-11-24')).toThrow('Invalid date');
  });
});

describe('getWarrantyStatus', () => {
  it('uses a 30-day threshold', () => {
    expect(EXPIRING_SOON_DAYS).toBe(30);
  });

  it.each([
    [365, 'active'],
    [31, 'active'],
    [30, 'expiringSoon'],
    [1, 'expiringSoon'],
    [0, 'expiringSoon'],
    [-1, 'expired'],
    [-400, 'expired'],
  ])('gives %i remaining days the status %s', (remainingDays, status) => {
    expect(getWarrantyStatus(remainingDays)).toBe(status);
  });
});

describe('getWarranty', () => {
  const today = '2026-11-24';

  it('combines the end date, the remaining days and the status', () => {
    expect(getWarranty({ purchaseDate: '2026-11-18', warrantyMonths: 24 }, today)).toEqual({
      endDate: '2028-11-18',
      remainingDays: 725,
      status: 'active',
    });
  });

  it('is active 31 days before the end date', () => {
    expect(getWarranty({ purchaseDate: '2024-12-25', warrantyMonths: 24 }, today)).toEqual({
      endDate: '2026-12-25',
      remainingDays: 31,
      status: 'active',
    });
  });

  it('expires soon exactly 30 days before the end date', () => {
    expect(getWarranty({ purchaseDate: '2024-12-24', warrantyMonths: 24 }, today)).toEqual({
      endDate: '2026-12-24',
      remainingDays: 30,
      status: 'expiringSoon',
    });
  });

  it('expires soon on its last day', () => {
    expect(getWarranty({ purchaseDate: '2024-11-24', warrantyMonths: 24 }, today)).toEqual({
      endDate: '2026-11-24',
      remainingDays: 0,
      status: 'expiringSoon',
    });
  });

  it('is expired the day after its last day', () => {
    expect(getWarranty({ purchaseDate: '2024-11-23', warrantyMonths: 24 }, today)).toEqual({
      endDate: '2026-11-23',
      remainingDays: -1,
      status: 'expired',
    });
  });
});
