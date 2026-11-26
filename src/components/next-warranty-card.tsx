import { SymbolView } from 'expo-symbols';
import { Card, PressableFeedback } from 'heroui-native';
import { Text, View } from 'react-native';

import { formatStoredDate } from '@/purchases/purchase-date';
import type { PurchaseWithWarranty } from '@/purchases/warranty-groups';
import { getRemainingDaysLabel } from '@/purchases/warranty-labels';
import { useBrandTint, useMutedColor, useOnBrandColor } from '@/theme/brand-colors';

import { CategoryIcon } from './category-icon';

type NextWarrantyCardProps = {
  /** The purchase whose warranty ends first, or undefined when every warranty has expired. */
  next?: PurchaseWithWarranty;
  onOpenPurchase: (purchaseId: string) => void;
};

/**
 * Card at the top of the warranties: the warranty that ends first.
 * It is filled with the brand colour, so it stands out from the purchase cards below it.
 */
export function NextWarrantyCard({ next, onOpenPurchase }: NextWarrantyCardProps) {
  const brandTint = useBrandTint();
  const onBrandColor = useOnBrandColor();
  const mutedColor = useMutedColor();

  if (next === undefined) {
    return (
      <Card className="gap-4 border border-border">
        <View className="flex-row items-center gap-2">
          <SymbolView
            name={{ ios: 'clock', android: 'schedule' }}
            size={16}
            tintColor={brandTint}
          />
          <Text className="text-sm font-semibold text-muted">Prochaine échéance</Text>
        </View>
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
      <Card className="gap-4 bg-accent">
        <View className="flex-row items-center gap-2">
          <SymbolView
            name={{ ios: 'clock.fill', android: 'schedule' }}
            size={16}
            tintColor={onBrandColor}
          />
          <Text className="text-xs font-semibold tracking-widest text-accent-foreground">
            PROCHAINE ÉCHÉANCE
          </Text>
        </View>

        <View className="flex-row items-baseline gap-2">
          <Text className="text-6xl font-bold text-accent-foreground">{days}</Text>
          <Text className="text-lg font-semibold text-accent-foreground">
            {days <= 1 ? 'jour restant' : 'jours restants'}
          </Text>
        </View>

        {/* The purchase sits on a panel in the usual card colour, so its icon keeps its tint. */}
        <View className="flex-row items-center gap-3 rounded-2xl bg-surface p-3">
          <CategoryIcon category={purchase.category} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {purchase.name}
            </Text>
            <Text className="text-sm text-muted">
              Garantie jusqu’au {formatStoredDate(warranty.endDate)}
            </Text>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={14}
            tintColor={mutedColor}
          />
        </View>
      </Card>
    </PressableFeedback>
  );
}
