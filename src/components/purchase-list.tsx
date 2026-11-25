import type { ReactNode } from 'react';
import { FlatList, View } from 'react-native';

import type { Purchase } from '@/purchases/purchase';
import { getWarranty } from '@/purchases/warranty';
import { countPurchasesByWarrantyStatus, type WarrantyCounts } from '@/purchases/warranty-groups';

import { EmptyState } from './empty-state';
import { ListHeading } from './list-heading';
import { PurchaseCard } from './purchase-card';
import { PurchaseOverview } from './purchase-overview';
import { ScreenTitle } from './screen-title';

const SUBTITLE = 'Tous vos achats, au même endroit.';

type PurchaseListProps = {
  /** The purchases to show, in the order they are given: the list never sorts them. */
  purchases: Purchase[];
  /**
   * Number of saved purchases, before any search. Defaults to the number of purchases shown.
   * It tells "no purchase at all" apart from "no purchase matches the search".
   */
  totalCount?: number;
  /**
   * Number of saved purchases in each warranty status, before any search.
   * Defaults to the statuses of the purchases shown.
   */
  warrantyCounts?: WarrantyCounts;
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
  warrantyCounts = countPurchasesByWarrantyStatus(purchases, today),
  controls,
  onOpenPurchase,
  onAddPurchase,
}: PurchaseListProps) {
  if (totalCount === 0) {
    return (
      <View className="gap-5 p-6">
        <ScreenTitle title="Mes achats" subtitle={SUBTITLE} />
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
        <View className="gap-5">
          <ScreenTitle title="Mes achats" subtitle={SUBTITLE} />
          <PurchaseOverview totalCount={totalCount} counts={warrantyCounts} />
          {controls}
          <ListHeading
            title={purchases.length === totalCount ? 'Tous les achats' : 'Résultats'}
            count={purchases.length}
          />
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
