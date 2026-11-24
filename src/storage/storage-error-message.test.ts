import { StorageError } from './purchase-storage';
import {
  getStorageErrorMessage,
  READ_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
  WRITE_ERROR_MESSAGE,
} from './storage-error-message';

describe('getStorageErrorMessage', () => {
  it('explains a read error', () => {
    expect(getStorageErrorMessage(new StorageError('read'))).toBe(READ_ERROR_MESSAGE);
  });

  it('explains a write error', () => {
    expect(getStorageErrorMessage(new StorageError('write'))).toBe(WRITE_ERROR_MESSAGE);
  });

  it('falls back to a generic sentence for any other error', () => {
    expect(getStorageErrorMessage(new Error('boom'))).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(getStorageErrorMessage(undefined)).toBe(UNKNOWN_ERROR_MESSAGE);
  });
});
