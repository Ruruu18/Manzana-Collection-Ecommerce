import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

/**
 * Background Notification Handler
 * This task runs when a notification is received while the app is in the background or killed
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('Background notification task error:', error);
    return;
  }

  if (data) {
    const notification = data as any;
    console.log('📬 Background notification received:', notification);

    // The notification will automatically be displayed by the system
    // You can perform additional background work here if needed
  }
});

/**
 * Register background notification task
 * Call this once when the app starts
 */
export const registerBackgroundNotificationTask = async () => {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('✅ Background notification task registered');
  } catch (error) {
    console.error('❌ Error registering background notification task:', error);
  }
};

/**
 * Unregister background notification task
 */
export const unregisterBackgroundNotificationTask = async () => {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('✅ Background notification task unregistered');
  } catch (error) {
    console.error('❌ Error unregistering background notification task:', error);
  }
};
