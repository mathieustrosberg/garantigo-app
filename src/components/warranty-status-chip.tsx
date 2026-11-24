import { Chip } from 'heroui-native';

import type { WarrantyStatus } from '@/purchases/warranty';
import { WARRANTY_STATUS_LABELS } from '@/purchases/warranty-labels';

const STATUS_COLORS = {
  active: 'success',
  expiringSoon: 'warning',
  expired: 'danger',
} as const satisfies Record<WarrantyStatus, string>;

type WarrantyStatusChipProps = {
  status: WarrantyStatus;
};

/** Small coloured label: green when active, orange when expiring soon, red when expired. */
export function WarrantyStatusChip({ status }: WarrantyStatusChipProps) {
  return (
    <Chip color={STATUS_COLORS[status]} variant="soft" size="sm">
      <Chip.Label>{WARRANTY_STATUS_LABELS[status]}</Chip.Label>
    </Chip>
  );
}
