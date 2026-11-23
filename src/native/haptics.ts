import * as Haptics from 'expo-haptics';

/**
 * Short vibration that confirms a successful action.
 * It never fails: a phone without haptics must not break the application.
 */
export async function notifySuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptic feedback is a bonus: nothing to do when it is unavailable.
  }
}
