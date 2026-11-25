import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PurchasesGate } from '@/components/purchases-gate';
import { demoPurchases } from '@/data/demo-purchases';
import { createAsyncPurchaseStorage } from '@/storage/async-purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';
import {
  BRAND_COLOR,
  BRAND_COLOR_ON_DARK,
  DARK_BACKGROUND,
  LIGHT_BACKGROUND,
} from '@/theme/brand-colors';

// The demonstration purchases are only saved on the very first launch.
const purchaseStorage = createAsyncPurchaseStorage(demoPurchases);

// Navigation themes with the brand colours: the back button, the header buttons and the
// background shown behind the screens.
const lightNavigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: BRAND_COLOR, background: LIGHT_BACKGROUND },
};
const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: BRAND_COLOR_ON_DARK,
    background: DARK_BACKGROUND,
    card: DARK_BACKGROUND,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? darkNavigationTheme : lightNavigationTheme}>
        <HeroUINativeProvider>
          <PurchasesProvider storage={purchaseStorage}>
            <PurchasesGate>
              <Stack screenOptions={{ headerBackTitle: 'Retour' }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="purchases/new"
                  options={{ title: 'Nouvel achat', presentation: 'modal' }}
                />
                <Stack.Screen
                  name="purchases/[id]/index"
                  options={{ title: "Détail de l'achat" }}
                />
                <Stack.Screen
                  name="purchases/[id]/edit"
                  options={{ title: "Modifier l'achat", presentation: 'modal' }}
                />
              </Stack>
            </PurchasesGate>
          </PurchasesProvider>
        </HeroUINativeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
