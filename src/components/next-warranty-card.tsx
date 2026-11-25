import { SymbolView } from 'expo-symbols';
import { Card, PressableFeedback } from 'heroui-native';
import { Text, View } from 'react-native';

import { formatStoredDate } from '@/purchases/purchase-date';
import type { PurchaseWithWarranty } from '@/purchases/warranty-groups';
import { getRemainingDaysLabel } from '@/purchases/warranty-labels';
import { useBrandTint } from '@/theme/brand-colors';

import { CategoryIcon } from './category-icon';

type NextWarrantyCardProps = {
  /** The purchase whose warranty ends first, or undefined when every warranty has expired. */
  next?: PurchaseWithWarranty;
  onOpenPurchase: (purchaseId: string) => void;
};

/** Card at the top of the warranties: the warranty that ends first, with its days left in large. */
export function NextWarrantyCard({ next, onOpenPurchase }: NextWarrantyCardProps) {
  const brandTint = useBrandTint();

  const heading = (
    <View className="flex-row items-center gap-2">
      <SymbolView name={{ ios: 'clock', android: 'schedule' }} size={16} tintColor={brandTint} />
      <Text className="text-sm font-semibold text-muted">Prochaine échéance</Text>
    </View>
  );

  if (next === undefined) {
    return (
      <Card className="gap-4 border border-border">
        {heading}
        <Text className="text-base text-foreground">
          Aucune garantie en cours : elles sont toutes expirées.
        </Text>
      </Card>
    );
  }

  const { purchase, warranty } = next;
  const days = warranty.remainingDays;

  return (
    <PressableFeedback
      onPress={() => onOpenPurchase(purchase.id)}
      accessibilityRole="button"
      accessibilityLabel={`Prochaine échéance : ${purchase.name}, ${getRemainingDaysLabel(days)}`}
    >
      <Card className="gap-4 border border-border">
        {heading}

        <View className="flex-row items-baseline gap-2">
          <Text className="text-4xl font-bold text-foreground">{days}</Text>
          <Text className="text-base text-muted">
            {days <= 1 ? 'jour restant' : 'jours restants'}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <CategoryIcon category={purchase.category} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              Garantie de {purchase.name}
            </Text>
            <Text className="text-sm text-muted">
              Jusqu’au {formatStoredDate(warranty.endDate)}
            </Text>
          </View>
        </View>
      </Card>
    </PressableFeedback>
  );
}
