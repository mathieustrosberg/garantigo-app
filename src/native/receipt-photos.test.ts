import * as ImagePicker from 'expo-image-picker';

import { deleteReceiptPhoto, getReceiptPhotoUri, takeReceiptPhoto } from './receipt-photos';

// The camera and the phone's files do not exist in Jest: small fakes stand in for them.
const mockFiles = new Set<string>();

jest.mock('expo-file-system', () => {
  function joinUri(parts: (string | { uri: string })[]): string {
    return parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
  }

  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = joinUri(parts);
    }
    create() {}
  }

  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = joinUri(parts);
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
    // Like the real one, the copy finishes later: it returns a promise.
    async copy(destination: File) {
      await Promise.resolve();
      if (!mockFiles.has(this.uri)) throw new Error('Missing source file');
      mockFiles.add(destination.uri);
    }
  }

  return { Directory, File, Paths: { document: new Directory('file:///documents') } };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const requestPermission = jest.mocked(ImagePicker.requestCameraPermissionsAsync);
const launchCamera = jest.mocked(ImagePicker.launchCameraAsync);

const CAMERA_PHOTO = 'file:///cache/camera/photo.jpg';

function allowCamera(granted: boolean) {
  requestPermission.mockResolvedValue({ granted } as ImagePicker.CameraPermissionResponse);
}

function cameraReturns(result: ImagePicker.ImagePickerResult) {
  launchCamera.mockResolvedValue(result);
}

beforeEach(() => {
  mockFiles.clear();
  mockFiles.add(CAMERA_PHOTO);
  jest.clearAllMocks();
});

describe('takeReceiptPhoto', () => {
  it('copies the photo into the receipts folder and returns its name only', async () => {
    allowCamera(true);
    cameraReturns({
      canceled: false,
      assets: [{ uri: CAMERA_PHOTO } as ImagePicker.ImagePickerAsset],
    });

    const result = await takeReceiptPhoto();

    expect(result.status).toBe('taken');
    if (result.status !== 'taken') return;
    expect(result.fileName).toMatch(/^receipt-.+\.jpg$/);
    expect(result.fileName).not.toContain('/');
    expect(mockFiles.has(`file:///documents/receipts/${result.fileName}`)).toBe(true);
  });

  it('does not open the camera when the permission is refused', async () => {
    allowCamera(false);

    expect(await takeReceiptPhoto()).toEqual({ status: 'permissionDenied' });
    expect(launchCamera).not.toHaveBeenCalled();
  });

  it('keeps nothing when the user closes the camera', async () => {
    allowCamera(true);
    cameraReturns({ canceled: true, assets: null });

    expect(await takeReceiptPhoto()).toEqual({ status: 'cancelled' });
    expect(mockFiles.size).toBe(1);
  });

  it('reports a failure instead of throwing when the photo cannot be copied', async () => {
    allowCamera(true);
    cameraReturns({
      canceled: false,
      assets: [{ uri: 'file:///cache/camera/missing.jpg' } as ImagePicker.ImagePickerAsset],
    });

    expect(await takeReceiptPhoto()).toEqual({ status: 'failed' });
  });

  it('reports a failure when the camera cannot open', async () => {
    allowCamera(true);
    launchCamera.mockRejectedValue(new Error('No camera on this device'));

    expect(await takeReceiptPhoto()).toEqual({ status: 'failed' });
  });
});

describe('getReceiptPhotoUri', () => {
  it('gives the address of a stored photo', () => {
    mockFiles.add('file:///documents/receipts/receipt-1.jpg');

    expect(getReceiptPhotoUri('receipt-1.jpg')).toBe('file:///documents/receipts/receipt-1.jpg');
  });

  it('gives nothing when the photo is no longer on the phone', () => {
    expect(getReceiptPhotoUri('receipt-unknown.jpg')).toBeUndefined();
  });
});

describe('deleteReceiptPhoto', () => {
  it('removes the photo from the receipts folder', () => {
    mockFiles.add('file:///documents/receipts/receipt-1.jpg');

    deleteReceiptPhoto('receipt-1.jpg');

    expect(mockFiles.has('file:///documents/receipts/receipt-1.jpg')).toBe(false);
  });

  it('does nothing when the photo is already gone', () => {
    expect(() => deleteReceiptPhoto('receipt-unknown.jpg')).not.toThrow();
  });
});
