import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { demoPurchases } from '@/data/demo-purchases';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';

// Temporary: purchases live in memory until the persistent storage replaces this line.
const purchaseStorage = createInMemoryPurchaseStorage(demoPurchases);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <HeroUINativeProvider>
          <PurchasesProvider storage={purchaseStorage}>
            <Stack screenOptions={{ headerBackTitle: 'Retour' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="purchases/new"
                options={{ title: 'Nouvel achat', presentation: 'modal' }}
              />
              <Stack.Screen name="purchases/[id]/index" options={{ title: "Détail de l'achat" }} />
              <Stack.Screen
                name="purchases/[id]/edit"
                options={{ title: "Modifier l'achat", presentation: 'modal' }}
              />
            </Stack>
          </PurchasesProvider>
        </HeroUINativeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
