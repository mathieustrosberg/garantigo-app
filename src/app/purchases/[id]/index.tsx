import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import { ScrollView, Text } from 'react-native';

import { PurchaseDetail } from '@/components/purchase-detail';
import { notifySuccess } from '@/native/haptics';
import { getReceiptPhotoUri } from '@/native/receipt-photos';
import { getToday } from '@/purchases/purchase-date';
import { usePurchases } from '@/storage/purchases-context';

export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases, removePurchase } = usePurchases();
  const { toast } = useToast();
  const purchase = purchases.find((candidate) => candidate.id === id);

  async function handleDelete(purchaseId: string) {
    await removePurchase(purchaseId);
    await notifySuccess();
    toast.show({ variant: 'success', label: 'Achat supprimé' });
    router.back();
  }

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
      receiptUri={
        purchase.receiptFileName === undefined
          ? undefined
          : getReceiptPhotoUri(purchase.receiptFileName)
      }
      onEdit={() => router.push(`/purchases/${purchase.id}/edit`)}
      onDelete={() => handleDelete(purchase.id)}
    />
  );
}
