import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { Text, View } from 'react-native';

// Empty shell: the form arrives with the purchase form.
export default function NewPurchaseScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 gap-4 bg-background p-6">
      <Text className="text-base text-muted">Le formulaire d’ajout sera affiché ici.</Text>
      <Button variant="secondary" onPress={() => router.back()}>
        Annuler
      </Button>
    </View>
  );
}
