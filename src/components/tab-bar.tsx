import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Button } from 'heroui-native';
import { Pressable, Text, View } from 'react-native';

import { useBrandTint, useMutedColor, useOnBrandColor } from '@/theme/brand-colors';

type Tab = {
  label: string;
  symbol: SymbolViewProps['name'];
};

/** Label and icon of each tab, by the name of its route. */
const TABS: Record<string, Tab> = {
  index: { label: 'Mes achats', symbol: { ios: 'bag', android: 'shopping_bag' } },
  warranties: {
    label: 'Mes garanties',
    symbol: { ios: 'checkmark.shield', android: 'verified_user' },
  },
};

type TabBarProps = {
  /** The routes of the tabs, in the order of the layout. */
  routes: { key: string; name: string }[];
  /** Position of the tab currently shown. */
  activeIndex: number;
  /** Height kept free at the bottom of the screen, under the home indicator of the iPhone. */
  bottomInset: number;
  onOpenTab: (routeKey: string) => void;
  onAddPurchase: () => void;
};

/** Bar at the bottom of the two main screens: one tab on each side, the add button in the middle. */
export function TabBar({
  routes,
  activeIndex,
  bottomInset,
  onOpenTab,
  onAddPurchase,
}: TabBarProps) {
  const onBrandColor = useOnBrandColor();

  function renderTab(routeName: string) {
    const index = routes.findIndex((route) => route.name === routeName);
    const route = routes[index];
    const tab = TABS[routeName];
    if (route === undefined || tab === undefined) return null;

    return (
      <TabItem tab={tab} isActive={index === activeIndex} onPress={() => onOpenTab(route.key)} />
    );
  }

  return (
    <View
      className="flex-row items-center border-t border-border bg-surface px-4 pt-2"
      style={{ paddingBottom: Math.max(bottomInset, 8) }}
    >
      {renderTab('index')}

      <View className="flex-1 items-center gap-1">
        <Button
          isIconOnly
          onPress={onAddPurchase}
          accessibilityLabel="Ajouter un achat"
          className="rounded-2xl"
        >
          <SymbolView name={{ ios: 'plus', android: 'add' }} size={20} tintColor={onBrandColor} />
        </Button>
        {/* The button already has a label for screen readers: they skip this text. */}
        <Text
          className="text-xs font-semibold text-foreground"
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          Ajouter
        </Text>
      </View>

      {renderTab('warranties')}
    </View>
  );
}

type TabItemProps = {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
};

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const brandTint = useBrandTint();
  const mutedColor = useMutedColor();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      className="flex-1 items-center justify-center gap-1 py-2"
    >
      <SymbolView name={tab.symbol} size={24} tintColor={isActive ? brandTint : mutedColor} />
      <Text className={`text-xs font-semibold ${isActive ? 'text-accent' : 'text-muted'}`}>
        {tab.label}
      </Text>
    </Pressable>
  );
}
