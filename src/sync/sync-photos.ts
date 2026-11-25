import type { Purchase } from '@/purchases/purchase';

/** What the synchronisation needs from the receipt photos kept on the phone. */
export interface LocalPhotos {
  has(fileName: string): boolean;
  read(fileName: string): Promise<ArrayBuffer>;
  /** Downloads the file at `url` and keeps it under `fileName`. */
  download(url: string, fileName: string): Promise<void>;
}

/** What the synchronisation needs from the receipt photos kept online, for one account. */
export interface RemotePhotos {
  /** File names of every photo of the account. */
  list(): Promise<string[]>;
  upload(fileName: string, content: ArrayBuffer): Promise<void>;
  /** A temporary address from which the photo can be downloaded. */
  getDownloadUrl(fileName: string): Promise<string>;
  remove(fileNames: string[]): Promise<void>;
}

/**
 * Brings the receipt photos of the phone and of the account to the same files.
 * `purchases` are the purchases of the phone, already synchronised: a photo is wanted
 * when one of them names it. Returns true when a photo was downloaded.
 */
export async function syncPhotos(
  purchases: Purchase[],
  localPhotos: LocalPhotos,
  remotePhotos: RemotePhotos,
): Promise<boolean> {
  const wantedNames = new Set<string>();
  for (const purchase of purchases) {
    if (purchase.receiptFileName !== undefined) wantedNames.add(purchase.receiptFileName);
  }

  const onlineNames = new Set(await remotePhotos.list());
  let hasDownloaded = false;

  for (const fileName of wantedNames) {
    const isOnPhone = localPhotos.has(fileName);
    const isOnline = onlineNames.has(fileName);

    if (isOnPhone && !isOnline) {
      // Taken on this phone: sent online.
      await remotePhotos.upload(fileName, await localPhotos.read(fileName));
    } else if (!isOnPhone && isOnline) {
      // Taken on another phone: brought here.
      await localPhotos.download(await remotePhotos.getDownloadUrl(fileName), fileName);
      hasDownloaded = true;
    }
  }

  // No purchase names them any more: their purchase was deleted, or its photo replaced.
  const unusedNames = [...onlineNames].filter((fileName) => !wantedNames.has(fileName));
  if (unusedNames.length > 0) await remotePhotos.remove(unusedNames);

  return hasDownloaded;
}
