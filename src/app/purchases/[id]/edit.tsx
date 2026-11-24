import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { ScrollView, Text } from 'react-native';

// Empty shell: the form arrives with the purchase form.
export default function EditPurchaseScreen() {
  const router = useRouter();

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
    >
      <Text className="text-base text-muted">Le formulaire de modification sera affiché ici.</Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Annuler
      </Button>
    </ScrollView>
  );
}
