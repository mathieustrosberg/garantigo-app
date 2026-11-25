import { SymbolView } from 'expo-symbols';
import { Card } from 'heroui-native';
import { Text, View } from 'react-native';

import type { WarrantyCounts } from '@/purchases/warranty-groups';
import { useBrandTint } from '@/theme/brand-colors';

import { WarrantyShareBar } from './warranty-share-bar';

type PurchaseOverviewProps = {
  /** Number of saved purchases. */
  totalCount: number;
  /** Number of saved purchases in each warranty status. */
  counts: WarrantyCounts;
};

/** Summary shown above the list: how many purchases are saved and how their warranties stand. */
export function PurchaseOverview({ totalCount, counts }: PurchaseOverviewProps) {
  const brandTint = useBrandTint();
  const coveredCount = counts.active + counts.expiringSoon;

  return (
    <Card className="gap-4 border border-border">
      <View className="flex-row items-center gap-2">
        <SymbolView
          name={{ ios: 'checkmark.shield', android: 'verified_user' }}
          size={16}
          tintColor={brandTint}
        />
        <Text className="text-sm font-semibold text-muted">Vue d’ensemble</Text>
      </View>

      <View className="flex-row justify-between">
        <Figure count={totalCount} singular="Achat enregistré" plural="Achats enregistrés" />
        <Figure
          count={coveredCount}
          singular="Garantie en cours"
          plural="Garanties en cours"
          alignment="end"
        />
      </View>

      <WarrantyShareBar counts={counts} />

      <View className="flex-row items-center gap-2">
        <View
          className={`size-2 rounded-full ${counts.expiringSoon > 0 ? 'bg-warning' : 'bg-success'}`}
        />
        <Text className="text-sm font-medium text-foreground">
          {getExpiringSoonLabel(counts.expiringSoon)}
        </Text>
      </View>
    </Card>
  );
}

type FigureProps = {
  count: number;
  singular: string;
  plural: string;
  alignment?: 'start' | 'end';
};

/** A large number above its label. Screen readers read both in one sentence. */
function Figure({ count, singular, plural, alignment = 'start' }: FigureProps) {
  const label = count === 1 ? singular : plural;

  return (
    <View
      className={alignment === 'end' ? 'items-end' : 'items-start'}
      accessible
      accessibilityLabel={`${count} ${label.toLowerCase()}`}
    >
      <Text className="text-4xl font-bold text-foreground">{count}</Text>
      <Text className="text-sm text-muted">{label}</Text>
    </View>
  );
}

function getExpiringSoonLabel(count: number): string {
  if (count === 0) return 'Aucune garantie n’expire bientôt.';
  return count === 1 ? '1 garantie expire bientôt.' : `${count} garanties expirent bientôt.`;
}
