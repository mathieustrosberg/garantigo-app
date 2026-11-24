import * as Haptics from 'expo-haptics';

import { notifySuccess } from './haptics';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const notificationAsync = jest.mocked(Haptics.notificationAsync);

beforeEach(() => {
  notificationAsync.mockReset();
});

describe('notifySuccess', () => {
  it('asks the phone for a success vibration', async () => {
    notificationAsync.mockResolvedValue(undefined);

    await notifySuccess();

    expect(notificationAsync).toHaveBeenCalledTimes(1);
    expect(notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('does not fail when the phone has no haptic feedback', async () => {
    notificationAsync.mockRejectedValue(new Error('Haptics unavailable'));

    await expect(notifySuccess()).resolves.toBeUndefined();
  });
});
