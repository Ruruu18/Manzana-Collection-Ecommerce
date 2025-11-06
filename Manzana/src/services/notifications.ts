import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Notification Service
 * Handles push notifications, permissions, and device token management
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'order' | 'promotion' | 'stock_alert' | 'general';
  orderId?: string;
  productId?: string;
  promotionId?: string;
  screen?: string;
  params?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token for this device
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for push notifications');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // For Expo Go, get token without projectId (will use Expo Go's project)
      // For development builds, you need a valid project ID
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = token.data;
        console.log('✅ Expo Push Token:', this.expoPushToken);
        return this.expoPushToken;
      } catch (tokenError: any) {
        // If token fails, it's okay - local notifications still work
        console.warn('⚠️ Could not get push token (this is normal in Expo Go)');
        console.warn('📱 Local notifications will still work');
        return null;
      }
    } catch (error) {
      console.error('Error in getExpoPushToken:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDeviceToken(userId: string): Promise<void> {
    try {
      console.log('📱 Registering device token for user:', userId);

      const token = await this.getExpoPushToken();
      if (!token) {
        console.warn('⚠️  No push token available - device may not support push notifications');
        return;
      }

      console.log('💾 Saving device token to database...');
      console.log('   User ID:', userId);
      console.log('   Platform:', Platform.OS);
      console.log('   Token:', token.substring(0, 40) + '...');

      // Save token to database
      const { data, error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_token',
        })
        .select();

      if (error) {
        console.error('❌ Error saving device token:', error);
        console.error('   Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Device token registered successfully!');
        console.log('   Database record:', data);
      }
    } catch (error) {
      console.error('💥 Error registering device token:', error);
    }
  }

  /**
   * Unregister device token (on sign out)
   */
  async unregisterDeviceToken(userId: string): Promise<void> {
    try {
      if (!this.expoPushToken) return;

      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId)
        .eq('device_token', this.expoPushToken);

      if (error) {
        console.error('Error unregistering device token:', error);
      } else {
        console.log('Device token unregistered successfully');
        this.expoPushToken = null;
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    triggerSeconds: number = 0
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: (data || {}) as Record<string, unknown>,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerSeconds > 0 ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds } : null,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    await this.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from Manzana Collection',
      { type: 'general' }
    );
  }
}

export const notificationService = new NotificationService();
