import { Accordion } from 'heroui-native';
import { ScrollView, Text, View } from 'react-native';

import { EXPIRING_SOON_DAYS } from '@/purchases/warranty';
import type { PurchaseWithWarranty, WarrantyGroups } from '@/purchases/warranty-groups';

import { EmptyState } from './empty-state';
import { ListHeading } from './list-heading';
import { NextWarrantyCard } from './next-warranty-card';
import { PurchaseCard } from './purchase-card';
import { ScreenTitle } from './screen-title';

const SUBTITLE = 'Ce qui arrive à échéance, en premier.';

/** The accordion has its own side padding: without it, its lines start where the cards do. */
const NO_SIDE_PADDING = { paddingHorizontal: 0 };

type WarrantyListProps = {
  groups: WarrantyGroups;
  onOpenPurchase: (purchaseId: string) => void;
  onAddPurchase: () => void;
};

/**
 * Dashboard of the warranties: the next one to end, then those that expire soon.
 * The active and the expired warranties are folded: one press on their title unfolds them.
 */
export function WarrantyList({ groups, onOpenPurchase, onAddPurchase }: WarrantyListProps) {
  const purchaseCount = groups.expiringSoon.length + groups.active.length + groups.expired.length;

  if (purchaseCount === 0) {
    return (
      <View className="gap-5 p-6">
        <ScreenTitle title="Mes garanties" subtitle={SUBTITLE} />
        <EmptyState
          title="Aucune garantie à suivre"
          description="Ajoutez un achat pour suivre la fin de sa garantie."
          actionLabel="Ajouter un achat"
          onAction={onAddPurchase}
        />
      </View>
    );
  }

  const foldedGroups = [
    {
      status: 'active',
      title: 'Garanties actives',
      emptyText: 'Aucune garantie active.',
      items: groups.active,
    },
    {
      status: 'expired',
      title: 'Garanties expirées',
      emptyText: 'Aucune garantie expirée.',
      items: groups.expired,
    },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-5 p-6">
      <ScreenTitle title="Mes garanties" subtitle={SUBTITLE} />

      {/* In each group the closest end comes first: the next one is at the top. */}
      <NextWarrantyCard
        next={groups.expiringSoon[0] ?? groups.active[0]}
        onOpenPurchase={onOpenPurchase}
      />

      <View className="gap-3">
        <ListHeading title="Expirent bientôt" count={groups.expiringSoon.length} />
        <GroupCards
          items={groups.expiringSoon}
          emptyText={`Aucune garantie n’arrive à échéance dans les ${EXPIRING_SOON_DAYS} jours.`}
          onOpenPurchase={onOpenPurchase}
        />
      </View>

      <Accordion selectionMode="multiple">
        {foldedGroups.map((group) => (
          <Accordion.Item key={group.status} value={group.status}>
            <Accordion.Trigger style={NO_SIDE_PADDING}>
              <View className="flex-1">
                <ListHeading title={group.title} count={group.items.length} />
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content style={NO_SIDE_PADDING}>
              <GroupCards
                items={group.items}
                emptyText={group.emptyText}
                onOpenPurchase={onOpenPurchase}
              />
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    </ScrollView>
  );
}

type GroupCardsProps = {
  items: PurchaseWithWarranty[];
  /** Sentence shown when the group has no purchase. */
  emptyText: string;
  onOpenPurchase: (purchaseId: string) => void;
};

/** The cards of one group, or a sentence when the group is empty. */
function GroupCards({ items, emptyText, onOpenPurchase }: GroupCardsProps) {
  if (items.length === 0) {
    return <Text className="text-base text-muted">{emptyText}</Text>;
  }

  return (
    <View className="gap-3">
      {items.map((item) => (
        <PurchaseCard
          key={item.purchase.id}
          purchase={item.purchase}
          warranty={item.warranty}
          onPress={() => onOpenPurchase(item.purchase.id)}
        />
      ))}
    </View>
  );
}
