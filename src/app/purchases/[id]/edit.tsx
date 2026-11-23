import { useLocalSearchParams, useRouter } from 'expo-router';
import { useToast } from 'heroui-native';
import { ScrollView, Text } from 'react-native';

import { PurchaseForm } from '@/components/purchase-form';
import { notifySuccess } from '@/native/haptics';
import type { PurchaseInput } from '@/purchases/purchase';
import { toFormValues } from '@/purchases/purchase-validation';
import { usePurchases } from '@/storage/purchases-context';

export default function EditPurchaseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases, updatePurchase } = usePurchases();
  const { toast } = useToast();
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

  const purchaseToEdit = purchase;

  async function handleSubmit(input: PurchaseInput) {
    // Spreading the purchase first keeps its id and its receipt photo.
    await updatePurchase({ ...purchaseToEdit, ...input });
    await notifySuccess();
    toast.show({ variant: 'success', label: 'Modifications enregistrées' });
    router.back();
  }

  return (
    <PurchaseForm
      initialValues={toFormValues(purchase)}
      submitLabel="Enregistrer les modifications"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
