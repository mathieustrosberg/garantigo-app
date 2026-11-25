import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      // Our own bar replaces the default one: it has the add button between the two tabs.
      tabBar={({ state, insets, navigateToTab }) => (
        <TabBar
          routes={state.routes}
          activeIndex={state.index}
          bottomInset={insets.bottom}
          onOpenTab={navigateToTab}
          onAddPurchase={() => router.push('/purchases/new')}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="warranties" />
    </Tabs>
  );
}
