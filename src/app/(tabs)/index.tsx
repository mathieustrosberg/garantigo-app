import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseList } from '@/components/purchase-list';
import { PurchaseListControls } from '@/components/purchase-list-controls';
import { getToday } from '@/purchases/purchase-date';
import { searchPurchases } from '@/purchases/purchase-search';
import { sortPurchases, type PurchaseSortKey } from '@/purchases/purchase-sort';
import { usePurchases } from '@/storage/purchases-context';

export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases } = usePurchases();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<PurchaseSortKey>('purchaseDate');
  const visiblePurchases = sortPurchases(searchPurchases(purchases, query), sortKey);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PurchaseList
          purchases={visiblePurchases}
          totalCount={purchases.length}
          today={getToday()}
          controls={
            <PurchaseListControls
              query={query}
              onQueryChange={setQuery}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
            />
          }
          onOpenPurchase={(purchaseId) => router.push(`/purchases/${purchaseId}`)}
          onAddPurchase={() => router.push('/purchases/new')}
        />
      </SafeAreaView>
    </View>
  );
}
