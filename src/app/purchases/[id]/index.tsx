import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { Text, View } from 'react-native';

import { usePurchases } from '@/storage/purchases-context';

// Empty shell: the full information arrives with the purchase detail screen.
export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases } = usePurchases();
  const purchase = purchases.find((candidate) => candidate.id === id);

  if (purchase === undefined) {
    return (
      <View className="flex-1 gap-4 bg-background p-6">
        <Text className="text-base text-muted">Cet achat est introuvable.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-background p-6">
      <Text className="text-2xl font-bold text-foreground">{purchase.name}</Text>
      <Text className="text-base text-muted">Le détail de l’achat sera affiché ici.</Text>
      <Button onPress={() => router.push(`/purchases/${purchase.id}/edit`)}>Modifier</Button>
    </View>
  );
}
