import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import { useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AccountProvider, useAccount } from '@/account/account-context';
import { AccountGate } from '@/components/account-gate';
import { PurchasesGate } from '@/components/purchases-gate';
import { demoPurchases } from '@/data/demo-purchases';
import {
  deleteReceiptPhoto,
  downloadReceiptPhoto,
  getReceiptPhotoUri,
  readReceiptPhoto,
} from '@/native/receipt-photos';
import { createAsyncPurchaseStorage } from '@/storage/async-purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';
import { createAsyncChangeLogStore } from '@/sync/change-log-store';
import { createAsyncOwnerStore } from '@/sync/owner-store';
import { createSupabaseRemotePhotos } from '@/sync/remote-photos';
import { createSupabaseRemotePurchases } from '@/sync/remote-purchases';
import { cloudClient } from '@/sync/supabase-client';
import { SyncProvider } from '@/sync/sync-context';
import type { LocalPhotos } from '@/sync/sync-photos';
import { createTrackedPurchaseStorage } from '@/sync/tracked-purchase-storage';
import {
  BRAND_COLOR,
  BRAND_COLOR_ON_DARK,
  DARK_BACKGROUND,
  LIGHT_BACKGROUND,
} from '@/theme/brand-colors';

// Without the online service, the demonstration purchases are saved on the very first launch.
// With it, the phone starts empty: the purchases are those of the account that signs in.
const firstLaunchPurchases = cloudClient === null ? demoPurchases : [];

// The storage also remembers when each purchase changed, so it can be synchronised.
const purchaseStorage = createTrackedPurchaseStorage(
  createAsyncPurchaseStorage(firstLaunchPurchases),
  createAsyncChangeLogStore(),
  createAsyncOwnerStore(),
  { deletePhoto: deleteReceiptPhoto },
);

// The receipt photos of the phone, as the synchronisation needs them.
const localPhotos: LocalPhotos = {
  has: (fileName) => getReceiptPhotoUri(fileName) !== undefined,
  read: readReceiptPhoto,
  download: downloadReceiptPhoto,
};

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
          <AccountProvider client={cloudClient}>
            <PurchasesProvider storage={purchaseStorage}>
              <SyncedPurchases>
                <PurchasesGate>
                  <AccountGate>
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
                      <Stack.Screen
                        name="account"
                        options={{ title: 'Compte', presentation: 'modal' }}
                      />
                    </Stack>
                  </AccountGate>
                </PurchasesGate>
              </SyncedPurchases>
            </PurchasesProvider>
          </AccountProvider>
        </HeroUINativeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Synchronises the purchases and their photos with the online copy of the signed-in account. */
function SyncedPurchases({ children }: { children: ReactNode }) {
  const accountId = useAccount().account?.id ?? null;
  // Without a signed-in account, there is no online copy: nothing is synchronised.
  const remote = useMemo(() => {
    if (cloudClient === null || accountId === null) return null;

    return {
      purchases: createSupabaseRemotePurchases(cloudClient, accountId),
      photos: createSupabaseRemotePhotos(cloudClient, accountId),
    };
  }, [accountId]);

  return (
    <SyncProvider
      storage={purchaseStorage}
      remote={remote?.purchases ?? null}
      localPhotos={localPhotos}
      remotePhotos={remote?.photos ?? null}
    >
      {children}
    </SyncProvider>
  );
}
