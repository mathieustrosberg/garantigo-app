import type { SupabaseClient } from '@supabase/supabase-js';

import { RemoteError } from './remote-purchases';
import type { RemotePhotos } from './sync-photos';

/** Private folder of the receipt photos (see supabase/schema.sql). */
const BUCKET = 'receipts';

/** How long a download address stays valid, in seconds. */
const DOWNLOAD_URL_LIFETIME = 60;

/** Largest number of photos read in one listing. */
const LIST_LIMIT = 1000;

/** The receipt photos of the account `userId`, kept in the Supabase project. */
export function createSupabaseRemotePhotos(client: SupabaseClient, userId: string): RemotePhotos {
  const folder = client.storage.from(BUCKET);
  // Each account has its own sub-folder: the access rules only open this one.
  const getPath = (fileName: string) => `${userId}/${fileName}`;

  return {
    async list() {
      const { data, error } = await folder.list(userId, { limit: LIST_LIMIT });
      if (error) throw new RemoteError(error.message);

      // The service may keep a hidden placeholder file in an empty folder.
      return data.map((file) => file.name).filter((name) => !name.startsWith('.'));
    },

    async upload(fileName, content) {
      const { error } = await folder.upload(getPath(fileName), content, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) throw new RemoteError(error.message);
    },

    async getDownloadUrl(fileName) {
      const { data, error } = await folder.createSignedUrl(
        getPath(fileName),
        DOWNLOAD_URL_LIFETIME,
      );
      if (error) throw new RemoteError(error.message);

      return data.signedUrl;
    },

    async remove(fileNames) {
      const { error } = await folder.remove(fileNames.map(getPath));
      if (error) throw new RemoteError(error.message);
    },
  };
}

/** Receipt photos kept in memory. In tests, two phones share them like a real account. */
export function createInMemoryRemotePhotos(): RemotePhotos {
  const files = new Map<string, ArrayBuffer>();

  return {
    async list() {
      return [...files.keys()];
    },

    async upload(fileName, content) {
      files.set(fileName, content);
    },

    async getDownloadUrl(fileName) {
      if (!files.has(fileName)) throw new RemoteError(`No photo named ${fileName}`);
      return `memory://${fileName}`;
    },

    async remove(fileNames) {
      for (const fileName of fileNames) files.delete(fileName);
    },
  };
}
