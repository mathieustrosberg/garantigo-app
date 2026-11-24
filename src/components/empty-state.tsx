import { Button } from 'heroui-native';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  description: string;
  /** Optional button, for example to add a first purchase. */
  actionLabel?: string;
  onAction?: () => void;
};

/** Message shown when a screen or a section has nothing to display. */
export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 rounded-2xl bg-surface p-6">
      <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
      <Text className="text-center text-base text-muted">{description}</Text>
      {actionLabel !== undefined && onAction !== undefined && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
