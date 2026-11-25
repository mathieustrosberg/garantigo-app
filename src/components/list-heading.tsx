import { Text, View } from 'react-native';

type ListHeadingProps = {
  title: string;
  /** Number of purchases listed under the heading. */
  count: number;
};

/** Heading of a group of purchases: its title on the left, the number of purchases on the right. */
export function ListHeading({ title, count }: ListHeadingProps) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text accessibilityRole="header" className="text-lg font-bold text-foreground">
        {title}
      </Text>
      <Text className="text-sm text-muted">{getCountLabel(count)}</Text>
    </View>
  );
}

/** In French, zero is singular: '0 élément', '1 élément', '2 éléments'. */
function getCountLabel(count: number): string {
  return count <= 1 ? `${count} élément` : `${count} éléments`;
}
