import { Button, Spinner } from 'heroui-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { usePurchases } from '@/storage/purchases-context';
import { READ_ERROR_MESSAGE } from '@/storage/storage-error-message';

type PurchasesGateProps = {
  children: ReactNode;
};

/**
 * Shows the screens only once the purchases are loaded.
 * A loading error is explained here, in one place, with a way to try again.
 */
export function PurchasesGate({ children }: PurchasesGateProps) {
  const { status, reload } = usePurchases();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 justify-center gap-4 bg-background p-6">
        <Text className="text-2xl font-bold text-foreground">Chargement impossible</Text>
        <Text className="text-base text-muted">{READ_ERROR_MESSAGE}</Text>
        <Button onPress={reload}>Réessayer</Button>
      </View>
    );
  }

  return children;
}
