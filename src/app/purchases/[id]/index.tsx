import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { ScrollView, Text } from 'react-native';

import { usePurchases } from '@/storage/purchases-context';

// Empty shell: the full information arrives with the purchase detail screen.
export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases } = usePurchases();
  const purchase = purchases.find((candidate) => candidate.id === id);

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
    >
      {purchase === undefined ? (
        <Text className="text-base text-muted">Cet achat est introuvable.</Text>
      ) : (
        <>
          <Text className="text-2xl font-bold text-foreground">{purchase.name}</Text>
          <Text className="text-base text-muted">Le détail de l’achat sera affiché ici.</Text>
          <Button onPress={() => router.push(`/purchases/${purchase.id}/edit`)}>Modifier</Button>
        </>
      )}
    </ScrollView>
  );
}
