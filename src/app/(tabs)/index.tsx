import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePurchases } from '@/storage/purchases-context';

// Empty shell: the real list arrives with the purchase list screen.
export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases, status } = usePurchases();
  const firstPurchase = purchases[0];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="gap-4 p-6">
          <Text className="text-3xl font-bold text-foreground">Mes achats</Text>
          <Text className="text-base text-muted">{getSummary(status, purchases.length)}</Text>

          <Button onPress={() => router.push('/purchases/new')}>Ajouter un achat</Button>

          {firstPurchase !== undefined && (
            <Button
              variant="secondary"
              onPress={() => router.push(`/purchases/${firstPurchase.id}`)}
            >
              Ouvrir le premier achat
            </Button>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function getSummary(status: 'loading' | 'ready' | 'error', count: number): string {
  if (status === 'loading') return 'Chargement de vos achats…';
  if (status === 'error') return 'Vos achats n’ont pas pu être chargés.';
  if (count === 0) return 'Aucun achat enregistré.';
  if (count === 1) return '1 achat enregistré.';
  return `${count} achats enregistrés.`;
}
