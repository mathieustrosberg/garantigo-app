import type { WarrantyStatus } from './warranty';

/** Status names shown to the user. */
export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  active: 'Active',
  expiringSoon: 'Expire bientôt',
  expired: 'Expirée',
};

/** Describes the remaining days in a sentence, for example '12 jours restants'. */
export function getRemainingDaysLabel(remainingDays: number): string {
  if (remainingDays === 0) return 'Dernier jour de garantie';
  if (remainingDays === 1) return '1 jour restant';
  if (remainingDays > 1) return `${remainingDays} jours restants`;
  if (remainingDays === -1) return 'Expirée depuis 1 jour';
  return `Expirée depuis ${-remainingDays} jours`;
}
