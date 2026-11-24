import { Surface } from 'heroui-native';
import { SectionList, Text, View } from 'react-native';

import { EXPIRING_SOON_DAYS, type WarrantyStatus } from '@/purchases/warranty';
import type { PurchaseWithWarranty, WarrantyGroups } from '@/purchases/warranty-groups';

import { EmptyState } from './empty-state';
import { PurchaseCard } from './purchase-card';

type WarrantySection = {
  status: WarrantyStatus;
  title: string;
  emptyText: string;
  data: PurchaseWithWarranty[];
};

type WarrantyListProps = {
  groups: WarrantyGroups;
  onOpenPurchase: (purchaseId: string) => void;
  onAddPurchase: () => void;
};

const COUNT_COLORS: Record<WarrantyStatus, string> = {
  active: 'text-success',
  expiringSoon: 'text-warning',
  expired: 'text-danger',
};

/** Purchases grouped by warranty status: the most urgent group comes first. */
export function WarrantyList({ groups, onOpenPurchase, onAddPurchase }: WarrantyListProps) {
  const sections: WarrantySection[] = [
    {
      status: 'expiringSoon',
      title: 'Expirent bientôt',
      emptyText: `Aucune garantie n’arrive à échéance dans les ${EXPIRING_SOON_DAYS} jours.`,
      data: groups.expiringSoon,
    },
    {
      status: 'active',
      title: 'Garanties actives',
      emptyText: 'Aucune garantie active.',
      data: groups.active,
    },
    {
      status: 'expired',
      title: 'Garanties expirées',
      emptyText: 'Aucune garantie expirée.',
      data: groups.expired,
    },
  ];
  const purchaseCount = sections.reduce((count, section) => count + section.data.length, 0);

  if (purchaseCount === 0) {
    return (
      <View className="gap-4 p-6">
        <Text className="text-3xl font-bold text-foreground">Mes garanties</Text>
        <EmptyState
          title="Aucune garantie à suivre"
          description="Ajoutez un achat pour suivre la fin de sa garantie."
          actionLabel="Ajouter un achat"
          onAction={onAddPurchase}
        />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.purchase.id}
      stickySectionHeadersEnabled={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-3 p-6"
      ListHeaderComponent={
        <View className="gap-4">
          <Text className="text-3xl font-bold text-foreground">Mes garanties</Text>
          <View className="flex-row gap-3">
            <StatusCount status="active" label="Actives" count={groups.active.length} />
            <StatusCount status="expiringSoon" label="Bientôt" count={groups.expiringSoon.length} />
            <StatusCount status="expired" label="Expirées" count={groups.expired.length} />
          </View>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text className="mt-4 text-lg font-bold text-foreground">{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <PurchaseCard
          purchase={item.purchase}
          warranty={item.warranty}
          onPress={() => onOpenPurchase(item.purchase.id)}
        />
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <Text className="text-base text-muted">{section.emptyText}</Text>
        ) : null
      }
    />
  );
}

type StatusCountProps = {
  status: WarrantyStatus;
  label: string;
  count: number;
};

function StatusCount({ status, label, count }: StatusCountProps) {
  return (
    <Surface
      className="flex-1 items-center gap-1"
      accessible
      accessibilityLabel={`${label} : ${count}`}
    >
      <Text className={`text-2xl font-bold ${COUNT_COLORS[status]}`}>{count}</Text>
      <Text className="text-sm text-muted">{label}</Text>
    </Surface>
  );
}
