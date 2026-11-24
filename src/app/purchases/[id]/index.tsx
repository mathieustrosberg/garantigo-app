import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { PurchaseDetail } from '@/components/purchase-detail';
import { getToday } from '@/purchases/purchase-date';
import { usePurchases } from '@/storage/purchases-context';

export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases } = usePurchases();
  const purchase = purchases.find((candidate) => candidate.id === id);

  if (purchase === undefined) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 bg-background"
        contentContainerClassName="p-6"
      >
        <Text className="text-base text-muted">Cet achat est introuvable.</Text>
      </ScrollView>
    );
  }

  return (
    <PurchaseDetail
      purchase={purchase}
      today={getToday()}
      onEdit={() => router.push(`/purchases/${purchase.id}/edit`)}
    />
  );
}
