import { Button, Card, Chip, Input, Label, TextField } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Temporary screen: it only proves that HeroUI Native renders on a real phone.
export default function HomeScreen() {
  const [pressCount, setPressCount] = useState(0);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerClassName="gap-4 p-6">
          <Text className="text-3xl font-bold text-foreground">GarantiGo</Text>

          <Card>
            <Card.Body>
              <Card.Title>Vos achats suivis</Card.Title>
              <Card.Description>Vos garanties protégées.</Card.Description>
            </Card.Body>
          </Card>

          <Chip color="success" variant="soft">
            <Chip.Label>Active</Chip.Label>
          </Chip>

          <TextField>
            <Label>Nom du produit</Label>
            <Input placeholder="Ex. Casque audio" />
          </TextField>

          <Button onPress={() => setPressCount((count) => count + 1)}>
            {`Appuis : ${pressCount}`}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
