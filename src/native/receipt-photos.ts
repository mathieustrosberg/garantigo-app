import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { createPurchaseId } from '@/purchases/purchase';

export type TakeReceiptPhotoResult =
  | { status: 'taken'; fileName: string }
  | { status: 'cancelled' }
  | { status: 'permissionDenied' }
  | { status: 'failed' };

export const RECEIPT_PHOTO_MESSAGES = {
  permissionDenied:
    'L’accès à l’appareil photo est refusé. Autorisez-le dans les Réglages du téléphone pour photographier le ticket.',
  failed: 'La photo n’a pas pu être enregistrée. Réessayez dans un instant.',
} as const;

/** Permanent folder of the application: unlike the cache, the system never empties it. */
function getReceiptsDirectory(): Directory {
  return new Directory(Paths.document, 'receipts');
}

/**
 * Opens the camera and keeps the photo in the receipts folder.
 * It never throws: every outcome is described by the returned status.
 */
export async function takeReceiptPhoto(): Promise<TakeReceiptPhotoResult> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'permissionDenied' };

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
    if (result.canceled) return { status: 'cancelled' };

    return { status: 'taken', fileName: await saveReceiptPhoto(result.assets[0].uri) };
  } catch {
    return { status: 'failed' };
  }
}

/** Copies a photo out of the camera's temporary cache and returns its new file name. */
async function saveReceiptPhoto(temporaryUri: string): Promise<string> {
  const directory = getReceiptsDirectory();
  directory.create({ idempotent: true });

  const fileName = `receipt-${createPurchaseId()}.jpg`;
  // Waiting for the copy keeps a failed copy inside the try/catch of takeReceiptPhoto.
  await new File(temporaryUri).copy(new File(directory, fileName));
  return fileName;
}

/** Address of a stored receipt photo, or undefined when the file is no longer on the phone. */
export function getReceiptPhotoUri(fileName: string): string | undefined {
  try {
    const file = new File(getReceiptsDirectory(), fileName);
    return file.exists ? file.uri : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Deletes a stored receipt photo. It never throws: a photo left on the phone
 * must not prevent the purchase from being deleted.
 */
export function deleteReceiptPhoto(fileName: string): void {
  try {
    const file = new File(getReceiptsDirectory(), fileName);
    if (file.exists) file.delete();
  } catch {
    // The file stays in the receipts folder, unused: nothing to show to the user.
  }
}
