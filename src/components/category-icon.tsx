import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useColorScheme, View } from 'react-native';

import type { PurchaseCategory } from '@/purchases/purchase';

const CATEGORY_SYMBOLS: Record<PurchaseCategory, SymbolViewProps['name']> = {
  'high-tech': { ios: 'desktopcomputer', android: 'devices' },
  home: { ios: 'house.fill', android: 'home' },
  kitchen: { ios: 'fork.knife', android: 'restaurant' },
  other: { ios: 'shippingbox.fill', android: 'inventory_2' },
};

/** One colour per category: a deep shade for light mode, a pastel shade for dark mode. */
const CATEGORY_TINTS: Record<PurchaseCategory, { light: string; dark: string }> = {
  'high-tech': { light: '#4A63E7', dark: '#ADBCFF' },
  home: { light: '#1E9E63', dark: '#86D9A8' },
  kitchen: { light: '#D9771F', dark: '#F2B880' },
  other: { light: '#7C55D9', dark: '#C6ABF7' },
};

/** Added to a '#RRGGBB' colour, it makes it 15 % opaque: the background of the tile. */
const TILE_OPACITY = '26';

const SIZES = {
  md: { tile: 'size-12 rounded-2xl', symbol: 22 },
  lg: { tile: 'size-16 rounded-3xl', symbol: 30 },
} as const;

type CategoryIconProps = {
  /** A purchase without a category gets the icon of the "other" category. */
  category?: PurchaseCategory;
  /** 'md' in the lists, 'lg' at the top of the detail. */
  size?: keyof typeof SIZES;
};

/** Small coloured tile with the icon of a category. Decorative: screen readers skip it. */
export function CategoryIcon({ category = 'other', size = 'md' }: CategoryIconProps) {
  const tint = CATEGORY_TINTS[category][useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <View
      testID={`category-icon-${category}`}
      className={`items-center justify-center ${SIZES[size].tile}`}
      style={{ backgroundColor: `${tint}${TILE_OPACITY}` }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SymbolView name={CATEGORY_SYMBOLS[category]} size={SIZES[size].symbol} tintColor={tint} />
    </View>
  );
}
