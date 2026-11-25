import { View } from 'react-native';

import type { WarrantyStatus } from '@/purchases/warranty';
import type { WarrantyCounts } from '@/purchases/warranty-groups';

const BAR_STATUSES: WarrantyStatus[] = ['active', 'expiringSoon', 'expired'];

const SHARE_COLORS: Record<WarrantyStatus, string> = {
  active: 'bg-accent',
  expiringSoon: 'bg-warning',
  expired: 'bg-separator',
};

type WarrantyShareBarProps = {
  /** Number of purchases in each warranty status. */
  counts: WarrantyCounts;
};

/**
 * Thin bar cut in up to three parts: each part is as wide as the share of its status.
 * Decorative: the numbers next to it already say it, so screen readers skip it.
 */
export function WarrantyShareBar({ counts }: WarrantyShareBarProps) {
  return (
    <View
      className="h-1.5 flex-row gap-1"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BAR_STATUSES.filter((status) => counts[status] > 0).map((status) => (
        <View
          key={status}
          className={`rounded-full ${SHARE_COLORS[status]}`}
          style={{ flex: counts[status] }}
        />
      ))}
    </View>
  );
}
