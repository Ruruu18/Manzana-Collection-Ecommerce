import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { NotificationData, notificationService } from '../services/notifications';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabase';

/**
 * Hook to handle notifications, permissions, and deep linking
 */
export const useNotificationHandler = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Request permissions and register token when user logs in
    if (user?.id) {
      registerForNotifications();
    }

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        handleNotificationReceived(notification);
      }
    );

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        handleNotificationResponse(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  /**
   * Request permissions and register device token
   */
  const registerForNotifications = async () => {
    try {
      if (!user?.id) return;

      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        await notificationService.registerDeviceToken(user.id);
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  /**
   * Handle notification received while app is open
   */
  const handleNotificationReceived = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;

    // Update badge count
    notificationService.getBadgeCount().then((count) => {
      notificationService.setBadgeCount(count + 1);
    });

    // You can show in-app notification UI here
    console.log('Notification data:', data);
  };

  /**
   * Handle notification tap/interaction
   */
  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    // Clear badge when user interacts with notification
    notificationService.clearBadge();

    // If it's a stock alert notification, deactivate the alert
    if (data.type === 'stock_alert' && data.productId && user?.id) {
      try {
        await supabase
          .from('stock_alerts')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('product_id', data.productId);

        console.log('✅ Stock alert deactivated after notification tap');
      } catch (error) {
        console.error('❌ Error deactivating stock alert:', error);
      }
    }

    // Navigate based on notification type
    navigateFromNotification(data);
  };

  /**
   * Navigate to appropriate screen based on notification data
   */
  const navigateFromNotification = (data: NotificationData) => {
    if (!data.type) return;

    try {
      switch (data.type) {
        case 'order':
          if (data.orderId) {
            navigation.navigate('Profile', {
              screen: 'OrderTracking',
              params: { orderId: data.orderId },
            });
          }
          break;

        case 'promotion':
          if (data.promotionId) {
            navigation.navigate('Promotions', {
              screen: 'PromotionDetails',
              params: { promotionId: data.promotionId },
            });
          }
          break;

        case 'stock_alert':
          if (data.productId) {
            navigation.navigate('Home', {
              screen: 'ProductDetails',
              params: { productId: data.productId },
            });
          }
          break;

        case 'general':
          if (data.screen) {
            // Navigate to custom screen if specified
            navigation.navigate(data.screen as any, data.params);
          } else {
            // Default to notifications screen
            navigation.navigate('Notifications');
          }
          break;

        default:
          console.warn('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };

  return {
    registerForNotifications,
    navigateFromNotification,
  };
};
