import { Button, Label } from 'heroui-native';
import { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';

import {
  getReceiptPhotoUri,
  RECEIPT_PHOTO_MESSAGES,
  takeReceiptPhoto,
} from '@/native/receipt-photos';

type ReceiptPhotoFieldProps = {
  /** Name of the photo in the receipts folder, or undefined when there is none. */
  fileName: string | undefined;
  onChange: (fileName: string | undefined) => void;
};

/** Optional receipt photo: taken with the camera only, with a preview, "Reprendre" and "Retirer". */
export function ReceiptPhotoField({ fileName, onChange }: ReceiptPhotoFieldProps) {
  const [isTaking, setIsTaking] = useState(false);
  const [problem, setProblem] = useState<'permissionDenied' | 'failed' | undefined>(undefined);

  async function handleTakePhoto() {
    setIsTaking(true);
    setProblem(undefined);
    const result = await takeReceiptPhoto();
    setIsTaking(false);

    if (result.status === 'taken') onChange(result.fileName);
    if (result.status === 'permissionDenied' || result.status === 'failed') {
      setProblem(result.status);
    }
  }

  return (
    <View className="gap-1.5">
      <Label>Photo du ticket</Label>

      {fileName === undefined ? (
        <Button variant="secondary" onPress={handleTakePhoto} isDisabled={isTaking}>
          Photographier le ticket
        </Button>
      ) : (
        <View className="gap-3">
          <ReceiptPreview fileName={fileName} />
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={handleTakePhoto}
              isDisabled={isTaking}
            >
              Reprendre
            </Button>
            <Button
              variant="danger-soft"
              className="flex-1"
              onPress={() => onChange(undefined)}
              isDisabled={isTaking}
            >
              Retirer
            </Button>
          </View>
        </View>
      )}

      {problem !== undefined && (
        <Text className="text-base text-danger">{RECEIPT_PHOTO_MESSAGES[problem]}</Text>
      )}
      {problem === 'permissionDenied' && (
        <Button variant="ghost" onPress={() => Linking.openSettings()}>
          Ouvrir les Réglages
        </Button>
      )}
    </View>
  );
}

function ReceiptPreview({ fileName }: { fileName: string }) {
  const uri = getReceiptPhotoUri(fileName);

  if (uri === undefined) {
    return (
      <Text className="text-base text-foreground">
        La photo du ticket est introuvable sur ce téléphone.
      </Text>
    );
  }
  return (
    <Image
      source={{ uri }}
      accessibilityLabel="Aperçu de la photo du ticket"
      resizeMode="contain"
      className="aspect-[3/4] w-full rounded-xl"
    />
  );
}
