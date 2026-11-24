import { getRemainingDaysLabel, WARRANTY_STATUS_LABELS } from './warranty-labels';

describe('getRemainingDaysLabel', () => {
  it.each([
    [725, '725 jours restants'],
    [31, '31 jours restants'],
    [2, '2 jours restants'],
    [1, '1 jour restant'],
    [0, 'Dernier jour de garantie'],
    [-1, 'Expirée depuis 1 jour'],
    [-2, 'Expirée depuis 2 jours'],
    [-400, 'Expirée depuis 400 jours'],
  ])('describes %i remaining days as "%s"', (remainingDays, label) => {
    expect(getRemainingDaysLabel(remainingDays)).toBe(label);
  });
});

describe('WARRANTY_STATUS_LABELS', () => {
  it('names the three statuses in French', () => {
    expect(WARRANTY_STATUS_LABELS).toEqual({
      active: 'Active',
      expiringSoon: 'Expire bientôt',
      expired: 'Expirée',
    });
  });
});
