import { useRouter } from 'expo-router';
import { useToast } from 'heroui-native';

import { PurchaseForm } from '@/components/purchase-form';
import { notifySuccess } from '@/native/haptics';
import type { PurchaseInput } from '@/purchases/purchase';
import { getToday } from '@/purchases/purchase-date';
import { getEmptyFormValues } from '@/purchases/purchase-validation';
import { usePurchases } from '@/storage/purchases-context';

export default function NewPurchaseScreen() {
  const router = useRouter();
  const { addPurchase } = usePurchases();
  const { toast } = useToast();

  async function handleSubmit(input: PurchaseInput) {
    await addPurchase(input);
    await notifySuccess();
    toast.show({ variant: 'success', label: 'Achat enregistré' });
    router.back();
  }

  return (
    <PurchaseForm
      initialValues={getEmptyFormValues(getToday())}
      submitLabel="Enregistrer cet achat"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
