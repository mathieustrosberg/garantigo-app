import { Button, Surface } from 'heroui-native';
import { ScrollView, Text, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { formatStoredDate } from '@/purchases/purchase-date';
import { CATEGORY_LABELS, formatPrice } from '@/purchases/purchase-labels';
import { getWarranty } from '@/purchases/warranty';
import { getRemainingDaysLabel } from '@/purchases/warranty-labels';

import { WarrantyStatusChip } from './warranty-status-chip';

type PurchaseDetailProps = {
  purchase: Purchase;
  /** 'YYYY-MM-DD', passed by the screen so that tests never depend on the real date. */
  today: string;
  onEdit: () => void;
};

/** Everything about one purchase: its warranty first, then the information typed in the form. */
export function PurchaseDetail({ purchase, today, onEdit }: PurchaseDetailProps) {
  const warranty = getWarranty(purchase, today);

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
    >
      <View className="gap-3">
        <View className="flex-row">
          <WarrantyStatusChip status={warranty.status} />
        </View>
        <Text className="text-2xl font-bold text-foreground">{purchase.name}</Text>
      </View>

      <Surface className="gap-1.5">
        <Text className="text-sm text-muted">Fin de garantie</Text>
        <Text className="text-lg font-bold text-foreground">
          {formatStoredDate(warranty.endDate)}
        </Text>
        <Text className="text-base text-muted">
          {getRemainingDaysLabel(warranty.remainingDays)}
        </Text>
      </Surface>

      <Surface className="gap-3">
        <DetailRow label="Date d’achat" value={formatStoredDate(purchase.purchaseDate)} />
        <DetailRow label="Durée de garantie" value={`${purchase.warrantyMonths} mois`} />
        <DetailRow
          label="Prix"
          value={purchase.price === undefined ? 'Non renseigné' : formatPrice(purchase.price)}
        />
        <DetailRow
          label="Catégorie"
          value={
            purchase.category === undefined ? 'Non renseignée' : CATEGORY_LABELS[purchase.category]
          }
        />
      </Surface>

      <Button onPress={onEdit}>Modifier</Button>
    </ScrollView>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row gap-3" accessible accessibilityLabel={`${label} : ${value}`}>
      <Text className="flex-1 text-base text-muted">{label}</Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  );
}
