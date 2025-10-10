import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { cartService } from "../../../services/cart";
import { Notification } from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  NOTIFICATION_TYPES,
} from "../../../constants/theme";
import { formatRelativeTime } from "../../../utils";
import LoadingState from "../../../components/LoadingState";
import Button from "../../../components/Button";

interface NotificationsScreenProps {
  navigation: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");
  const [cartCount, setCartCount] = useState(0);

  const filteredNotifications =
    selectedTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  // Refresh cart count and notifications when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadCartCount();
      refreshNotifications();
    }, [user])
  );

  const loadCartCount = async () => {
    if (!user?.id) return;
    const { count } = await cartService.getCartCount(user.id);
    setCartCount(count || 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Navigate to notification details screen
    // The screen will automatically mark as read
    navigation.navigate("NotificationDetails", {
      notificationId: notification.id,
    });
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Mark as Read",
      "Do you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All",
          onPress: markAllAsRead,
        },
      ],
    );
  };

  const handleDeleteNotification = (notification: Notification) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(notification.id),
        },
      ],
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "promotion":
        return "pricetag";
      case "stock_alert":
        return "notifications";
      case "order":
        return "receipt";
      case "product":
        return "cube";
      default:
        return "information-circle";
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "promotion":
        return COLORS.error;
      case "stock_alert":
        return COLORS.warning;
      case "order":
        return COLORS.success;
      case "product":
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? "99+" : String(cartCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "all" && styles.activeTab]}
        onPress={() => setSelectedTab("all")}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === "all" && styles.activeTabText,
          ]}
        >
          All ({notifications.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === "unread" && styles.activeTab]}
        onPress={() => setSelectedTab("unread")}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === "unread" && styles.activeTabText,
          ]}
        >
          Unread ({unreadCount})
        </Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{String(unreadCount)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDeleteNotification(item)}
    >
      <View style={styles.notificationIconContainer}>
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: getNotificationIconColor(item.type) },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={20}
            color={COLORS.white}
          />
        </View>
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>

        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Text style={styles.notificationType}>
            {NOTIFICATION_TYPES[item.type as keyof typeof NOTIFICATION_TYPES] ||
              item.type}
          </Text>

          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item)}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={
          selectedTab === "unread"
            ? "checkmark-done-circle-outline"
            : "notifications-outline"
        }
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {selectedTab === "unread" ? "All caught up!" : "No notifications"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedTab === "unread"
          ? "You have no unread notifications"
          : "Notifications will appear here when you receive them"}
      </Text>

      {selectedTab === "unread" && notifications.length > 0 && (
        <Button
          title="View all notifications"
          onPress={() => setSelectedTab("all")}
          variant="outline"
          style={styles.viewAllButton}
        />
      )}
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading notifications">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={renderSeparator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  markAllButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  markAllText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.md,
    position: "relative",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  unreadBadge: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    alignItems: "flex-start",
  },
  unreadNotification: {
    backgroundColor: COLORS.surface,
  },
  notificationIconContainer: {
    marginRight: SPACING.md,
    paddingTop: SPACING.xs,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  notificationMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.lg + 40 + SPACING.md, // Align with content
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  viewAllButton: {
    alignSelf: "center",
  },
});

export default NotificationsScreen;
