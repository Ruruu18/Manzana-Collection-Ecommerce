import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { Notification, UseNotificationsReturn } from "../types";
import { useAuth } from "./useAuth";
import * as ExpoNotifications from "expo-notifications";
import { Platform } from "react-native";

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Configure notification handling
  useEffect(() => {
    ExpoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (user) {
      setupPushNotifications();
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [user]);

  const setupPushNotifications = async () => {
    if (!user?.id) return;

    try {
      const { status: existingStatus } =
        await ExpoNotifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await ExpoNotifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {

        return;
      }

      // Get push notification token
      const token = await ExpoNotifications.getExpoPushTokenAsync();

      // Save token to user profile
      await supabase
        .from("users")
        .update({ push_token: token.data })
        .eq("id", user.id);

      // Set notification categories for iOS
      if (Platform.OS === "ios") {
        await ExpoNotifications.setNotificationCategoryAsync("promotion", [
          {
            identifier: "view",
            buttonTitle: "Ver Promoción",
            options: { opensAppToForeground: true },
          },
        ]);

        await ExpoNotifications.setNotificationCategoryAsync("stock_alert", [
          {
            identifier: "view",
            buttonTitle: "View Product",
            options: { opensAppToForeground: true },
          },
        ]);
      }
    } catch (error) {

    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }


      setNotifications(data || []);

      // Calculate unread count
      const unread = data?.filter((n: any) => !n.is_read).length || 0;

      setUnreadCount(unread);

      // Update badge count
      await ExpoNotifications.setBadgeCountAsync(unread);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribeToNotifications = useCallback(() => {
    if (!user?.id) return () => {};

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show local notification
          showLocalNotification(newNotification);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {

          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n,
            ),
          );

          // Update unread count if notification was marked as read
          if (updatedNotification.is_read) {

            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();



    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const showLocalNotification = async (notification: Notification) => {
    try {
      console.log("🔔 Showing local notification:", notification.title);
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            type: notification.type,
            ...notification.data,
          },
          categoryIdentifier: notification.type,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error("🔔 Error showing local notification:", error);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notificationId);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update badge count
      const newUnreadCount = Math.max(0, unreadCount - 1);
      await ExpoNotifications.setBadgeCountAsync(newUnreadCount);
    } catch (error) {

    }
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        throw error;
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      setUnreadCount(0);
      await ExpoNotifications.setBadgeCountAsync(0);
    } catch (error) {

    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        throw error;
      }

      // Update local state
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Update unread count if the deleted notification was unread
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        const newUnreadCount = Math.max(0, unreadCount - 1);
        await ExpoNotifications.setBadgeCountAsync(newUnreadCount);
      }
    } catch (error) {

    }
  };

  const refreshNotifications = async (): Promise<void> => {
    await fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };
};
