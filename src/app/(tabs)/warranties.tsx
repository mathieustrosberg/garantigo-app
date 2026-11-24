import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WarrantyList } from '@/components/warranty-list';
import { getToday } from '@/purchases/purchase-date';
import { groupPurchasesByWarrantyStatus } from '@/purchases/warranty-groups';
import { usePurchases } from '@/storage/purchases-context';

export default function WarrantiesScreen() {
  const router = useRouter();
  const { purchases } = usePurchases();
  const groups = groupPurchasesByWarrantyStatus(purchases, getToday());

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <WarrantyList
          groups={groups}
          onOpenPurchase={(purchaseId) => router.push(`/purchases/${purchaseId}`)}
          onAddPurchase={() => router.push('/purchases/new')}
        />
      </SafeAreaView>
    </View>
  );
}
