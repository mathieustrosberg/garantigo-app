import { SymbolView } from 'expo-symbols';
import { Button } from 'heroui-native';

import { useBrandTint } from '@/theme/brand-colors';

type AccountButtonProps = {
  onPress: () => void;
};

/** Round button that opens the account screen. */
export function AccountButton({ onPress }: AccountButtonProps) {
  const brandTint = useBrandTint();

  return (
    <Button isIconOnly variant="secondary" onPress={onPress} accessibilityLabel="Compte">
      <SymbolView
        name={{ ios: 'person.crop.circle.fill', android: 'account_circle' }}
        size={22}
        tintColor={brandTint}
      />
    </Button>
  );
}
