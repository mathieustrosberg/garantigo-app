import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseList } from '@/components/purchase-list';
import { getToday } from '@/purchases/purchase-date';
import { usePurchases } from '@/storage/purchases-context';

export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases } = usePurchases();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <PurchaseList
          purchases={purchases}
          today={getToday()}
          onOpenPurchase={(purchaseId) => router.push(`/purchases/${purchaseId}`)}
          onAddPurchase={() => router.push('/purchases/new')}
        />
      </SafeAreaView>
    </View>
  );
}
