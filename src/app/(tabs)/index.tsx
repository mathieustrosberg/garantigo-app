import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAccount } from '@/account/account-context';
import { AccountButton } from '@/components/account-button';
import { PurchaseList } from '@/components/purchase-list';
import { PurchaseListControls } from '@/components/purchase-list-controls';
import { getToday } from '@/purchases/purchase-date';
import { searchPurchases } from '@/purchases/purchase-search';
import { sortPurchases, type PurchaseSortKey } from '@/purchases/purchase-sort';
import { countPurchasesByWarrantyStatus } from '@/purchases/warranty-groups';
import { usePurchases } from '@/storage/purchases-context';

export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases } = usePurchases();
  const { status: accountStatus } = useAccount();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<PurchaseSortKey>('purchaseDate');
  const today = getToday();
  const visiblePurchases = sortPurchases(searchPurchases(purchases, query), sortKey);
  // Counted on every saved purchase: the search must not change the summary.
  const warrantyCounts = countPurchasesByWarrantyStatus(purchases, today);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PurchaseList
          purchases={visiblePurchases}
          totalCount={purchases.length}
          warrantyCounts={warrantyCounts}
          today={today}
          controls={
            <PurchaseListControls
              query={query}
              onQueryChange={setQuery}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
            />
          }
          titleAction={
            // Without the online service, there is no account to open.
            accountStatus === 'signedIn' && (
              <AccountButton onPress={() => router.push('/account')} />
            )
          }
          onOpenPurchase={(purchaseId) => router.push(`/purchases/${purchaseId}`)}
          onAddPurchase={() => router.push('/purchases/new')}
        />
      </SafeAreaView>
    </View>
  );
}
