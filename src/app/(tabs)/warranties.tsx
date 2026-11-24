import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Empty shell: purchases grouped by warranty status arrive with the warranties screen.
export default function WarrantiesScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View className="gap-4 p-6">
          <Text className="text-3xl font-bold text-foreground">Mes garanties</Text>
          <Text className="text-base text-muted">Vos garanties seront regroupées ici.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
