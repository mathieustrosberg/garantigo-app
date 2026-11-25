import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';

import { useBrandTint } from '@/theme/brand-colors';

type SymbolTileProps = {
  name: SymbolViewProps['name'];
};

/** Small tinted tile with an icon, shown in front of a piece of information. Decorative. */
export function SymbolTile({ name }: SymbolTileProps) {
  const brandTint = useBrandTint();

  return (
    <View
      className="size-10 items-center justify-center rounded-xl bg-accent-soft"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SymbolView name={name} size={18} tintColor={brandTint} />
    </View>
  );
}
