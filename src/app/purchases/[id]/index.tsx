import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { PurchaseDetail } from '@/components/purchase-detail';
import { notifySuccess } from '@/native/haptics';
import { getReceiptPhotoUri } from '@/native/receipt-photos';
import type { Purchase } from '@/purchases/purchase';
import { getToday } from '@/purchases/purchase-date';
import { usePurchases } from '@/storage/purchases-context';

/** What the screen showed when the deletion was confirmed. */
type DeletedDetail = {
  purchase: Purchase;
  receiptUri: string | undefined;
};

export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases, removePurchase } = usePurchases();
  const { toast } = useToast();
  // Once deleted, the purchase and its photo are gone: the screen keeps showing them while it goes back.
  const [deletedDetail, setDeletedDetail] = useState<DeletedDetail | undefined>(undefined);
  const purchase = deletedDetail?.purchase ?? purchases.find((candidate) => candidate.id === id);

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

  const receiptUri =
    deletedDetail !== undefined
      ? deletedDetail.receiptUri
      : purchase.receiptFileName === undefined
        ? undefined
        : getReceiptPhotoUri(purchase.receiptFileName);

  async function handleDelete(detail: DeletedDetail) {
    setDeletedDetail(detail);
    try {
      await removePurchase(detail.purchase.id);
    } catch (error) {
      // The purchase is still there: the detail shows it again, with the error message.
      setDeletedDetail(undefined);
      throw error;
    }
    await notifySuccess();
    toast.show({ variant: 'success', label: 'Achat supprimé' });
    router.back();
  }

  return (
    <PurchaseDetail
      purchase={purchase}
      today={getToday()}
      receiptUri={receiptUri}
      onEdit={() => router.push(`/purchases/${purchase.id}/edit`)}
      onDelete={() => handleDelete({ purchase, receiptUri })}
    />
  );
}
