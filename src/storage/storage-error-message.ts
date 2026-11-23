import { StorageError } from './purchase-storage';

export const READ_ERROR_MESSAGE =
  'Vos achats n’ont pas pu être lus sur ce téléphone. Réessayez dans un instant.';

export const WRITE_ERROR_MESSAGE =
  'La modification n’a pas pu être enregistrée. Vérifiez l’espace disponible sur le téléphone, puis réessayez.';

export const UNKNOWN_ERROR_MESSAGE =
  'Une erreur inattendue est survenue. Réessayez dans un instant.';

/** Turns a storage failure into a sentence that can be shown to the user. */
export function getStorageErrorMessage(error: unknown): string {
  if (!(error instanceof StorageError)) return UNKNOWN_ERROR_MESSAGE;
  return error.operation === 'read' ? READ_ERROR_MESSAGE : WRITE_ERROR_MESSAGE;
}
