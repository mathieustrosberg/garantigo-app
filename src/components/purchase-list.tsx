import { Button } from 'heroui-native';
import type { ReactNode } from 'react';
import { FlatList, Text, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { getWarranty } from '@/purchases/warranty';

import { EmptyState } from './empty-state';
import { PurchaseCard } from './purchase-card';

type PurchaseListProps = {
  /** The purchases to show, in the order they are given: the list never sorts them. */
  purchases: Purchase[];
  /**
   * Number of saved purchases, before any search. Defaults to the number of purchases shown.
   * It tells "no purchase at all" apart from "no purchase matches the search".
   */
  totalCount?: number;
  /** 'YYYY-MM-DD', passed by the screen so that tests never depend on the real date. */
  today: string;
  /** Search and sort controls, shown above the purchases. */
  controls?: ReactNode;
  onOpenPurchase: (purchaseId: string) => void;
  onAddPurchase: () => void;
};

export function PurchaseList({
  purchases,
  totalCount = purchases.length,
  today,
  controls,
  onOpenPurchase,
  onAddPurchase,
}: PurchaseListProps) {
  if (totalCount === 0) {
    return (
      <View className="gap-4 p-6">
        <Text className="text-3xl font-bold text-foreground">Mes achats</Text>
        <EmptyState
          title="Aucun achat"
          description="Ajoutez votre premier achat pour suivre la fin de sa garantie."
          actionLabel="Ajouter un achat"
          onAction={onAddPurchase}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={purchases}
      keyExtractor={(purchase) => purchase.id}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerClassName="gap-3 p-6"
      ListHeaderComponent={
        <View className="gap-4">
          <Text className="text-3xl font-bold text-foreground">Mes achats</Text>
          <Text className="text-base text-muted">{getPurchaseCountLabel(totalCount)}</Text>
          <Button onPress={onAddPurchase}>Ajouter un achat</Button>
          {controls}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Aucun résultat"
          description="Aucun achat ne correspond à votre recherche."
        />
      }
      renderItem={({ item }) => (
        <PurchaseCard
          purchase={item}
          warranty={getWarranty(item, today)}
          onPress={() => onOpenPurchase(item.id)}
        />
      )}
    />
  );
}

function getPurchaseCountLabel(count: number): string {
  return count === 1 ? '1 achat enregistré.' : `${count} achats enregistrés.`;
}
