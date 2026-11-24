import { Card, PressableFeedback } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';
import { formatStoredDate } from '@/purchases/purchase-date';
import type { Warranty } from '@/purchases/warranty';
import { getRemainingDaysLabel, WARRANTY_STATUS_LABELS } from '@/purchases/warranty-labels';

import { WarrantyStatusChip } from './warranty-status-chip';

type PurchaseCardProps = {
  purchase: Purchase;
  warranty: Warranty;
  onPress: () => void;
};

/** One purchase in a list: its name, the end of its warranty and its status. */
export function PurchaseCard({ purchase, warranty, onPress }: PurchaseCardProps) {
  const remainingDaysLabel = getRemainingDaysLabel(warranty.remainingDays);

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${purchase.name}, ${WARRANTY_STATUS_LABELS[warranty.status]}, ${remainingDaysLabel}`}
    >
      <Card className="flex-row items-center gap-3">
        <Card.Body>
          <Card.Title numberOfLines={1}>{purchase.name}</Card.Title>
          <Card.Description>Fin le {formatStoredDate(warranty.endDate)}</Card.Description>
          <Card.Description>{remainingDaysLabel}</Card.Description>
        </Card.Body>
        <WarrantyStatusChip status={warranty.status} />
      </Card>
    </PressableFeedback>
  );
}
