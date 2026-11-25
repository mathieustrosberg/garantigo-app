import { Text, View } from 'react-native';

type ScreenTitleProps = {
  title: string;
  subtitle: string;
};

/** Large title at the top of a tab, with a short sentence that says what the screen is for. */
export function ScreenTitle({ title, subtitle }: ScreenTitleProps) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-semibold tracking-widest text-muted">MON ESPACE</Text>
      <View className="flex-row items-baseline">
        <Text accessibilityRole="header" className="text-4xl font-bold text-foreground">
          {title}
        </Text>
        {/* Decorative dot in the brand colour: screen readers skip it. */}
        <Text
          className="text-4xl font-bold text-accent"
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          .
        </Text>
      </View>
      <Text className="text-base text-muted">{subtitle}</Text>
    </View>
  );
}
