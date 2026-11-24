import { Button } from 'heroui-native';
import { FlatList, Text, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { getWarranty } from '@/purchases/warranty';

import { EmptyState } from './empty-state';
import { PurchaseCard } from './purchase-card';

type PurchaseListProps = {
  /** The purchases to show, in the order they are given: the list never sorts them. */
  purchases: Purchase[];
  /** 'YYYY-MM-DD', passed by the screen so that tests never depend on the real date. */
  today: string;
  onOpenPurchase: (purchaseId: string) => void;
  onAddPurchase: () => void;
};

export function PurchaseList({
  purchases,
  today,
  onOpenPurchase,
  onAddPurchase,
}: PurchaseListProps) {
  if (purchases.length === 0) {
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
      contentContainerClassName="gap-3 p-6"
      ListHeaderComponent={
        <View className="gap-4">
          <Text className="text-3xl font-bold text-foreground">Mes achats</Text>
          <Text className="text-base text-muted">{getPurchaseCountLabel(purchases.length)}</Text>
          <Button onPress={onAddPurchase}>Ajouter un achat</Button>
        </View>
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
