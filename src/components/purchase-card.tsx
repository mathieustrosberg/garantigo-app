import { Card, PressableFeedback } from 'heroui-native';
import { Text, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { formatStoredDate } from '@/purchases/purchase-date';
import type { Warranty } from '@/purchases/warranty';
import { getRemainingDaysLabel, WARRANTY_STATUS_LABELS } from '@/purchases/warranty-labels';

import { CategoryIcon } from './category-icon';
import { WarrantyStatusChip } from './warranty-status-chip';

type PurchaseCardProps = {
  purchase: Purchase;
  warranty: Warranty;
  onPress: () => void;
};

/** One purchase in a list: its category icon, its name, the end of its warranty and its status. */
export function PurchaseCard({ purchase, warranty, onPress }: PurchaseCardProps) {
  const remainingDaysLabel = getRemainingDaysLabel(warranty.remainingDays);

  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${purchase.name}, ${WARRANTY_STATUS_LABELS[warranty.status]}, ${remainingDaysLabel}`}
    >
      <Card className="flex-row items-center gap-3 border border-border">
        <CategoryIcon category={purchase.category} />
        {/* flex-1 lets a long name shrink instead of pushing the status out of the card. */}
        <Card.Body className="flex-1">
          <Card.Title numberOfLines={1} className="text-base font-semibold">
            {purchase.name}
          </Card.Title>
          <Card.Description className="text-sm">
            Fin le {formatStoredDate(warranty.endDate)}
          </Card.Description>
        </Card.Body>
        <View className="gap-1">
          {/* The row pushes the chip to the right, above the days left. */}
          <View className="flex-row justify-end">
            <WarrantyStatusChip status={warranty.status} />
          </View>
          <Text className="text-right text-xs text-muted">{remainingDaysLabel}</Text>
        </View>
      </Card>
    </PressableFeedback>
  );
}
