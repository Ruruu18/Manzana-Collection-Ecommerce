import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  NOTIFICATION_TYPES,
} from "../../constants/theme";
import { formatDate, optimizeImageUrl } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: keyof typeof NOTIFICATION_TYPES;
  is_read: boolean;
  created_at: string;
  data?: {
    product_id?: string;
    promotion_id?: string;
    order_id?: string;
    orderId?: string;
    orderNumber?: string;
    image_url?: string;
    action_url?: string;
  };
}

interface NotificationDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      notificationId: string;
    };
  };
}

const NotificationDetailsScreen: React.FC<NotificationDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { notificationId } = route.params;
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    loadNotificationDetails();
  }, [notificationId]);

  const loadNotificationDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", notificationId)
        .single();

      if (error) throw error;

      console.log('📧 Notification loaded:', data);
      console.log('📧 Is read:', data.is_read);

      setNotification(data);

      // Mark as read if not already read
      if (!data.is_read) {
        console.log('📧 Marking notification as read...');
        const result = await markAsRead();
        console.log('📧 Mark as read result:', result);
      }
    } catch (error) {
      console.error("Error loading notification details:", error);
      Alert.alert("Error", "Could not load notification");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .select();

      if (error) {
        console.error("❌ Error marking notification as read:", error);
        throw error;
      }

      console.log('✅ Successfully marked as read:', data);
      return { data, error: null };
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      return { data: null, error };
    }
  };

  const handleAction = () => {
    if (!notification?.data) return;

    const { product_id, promotion_id, order_id, orderId, orderNumber, action_url } =
      notification.data;

    // Handle order navigation - check for both order_id and orderId
    const orderIdToUse = order_id || orderId;

    if (orderIdToUse) {
      navigation.navigate("OrderDetails", { orderId: orderIdToUse });
    } else if (product_id) {
      navigation.navigate("ProductDetails", { productId: product_id });
    } else if (promotion_id) {
      navigation.navigate("PromotionDetails", { promotionId: promotion_id });
    } else if (action_url) {
      // Parse action_url to navigate appropriately
      if (action_url.includes("/orders/")) {
        const orderId = action_url.split("/orders/")[1];
        navigation.navigate("OrderDetails", { orderId });
      } else if (action_url.includes("/admin/orders/")) {
        const orderId = action_url.split("/admin/orders/")[1];
        navigation.navigate("OrderDetails", { orderId });
      } else if (action_url.includes("/product/")) {
        const productId = action_url.split("/product/")[1];
        navigation.navigate("ProductDetails", { productId });
      } else if (action_url.includes("/promotion/")) {
        const promotionId = action_url.split("/promotion/")[1];
        navigation.navigate("PromotionDetails", { promotionId });
      } else {
        Alert.alert("Information", "Unable to navigate to this content");
      }
    }
  };

  const getNotificationIcon = (type: keyof typeof NOTIFICATION_TYPES) => {
    switch (type) {
      case "promotion":
        return "pricetag";
      case "stock_alert":
        return "notifications";
      case "order":
        return "cube";
      case "system":
        return "information-circle";
      case "product":
        return "shirt";
      default:
        return "mail";
    }
  };

  const getNotificationColor = (type: keyof typeof NOTIFICATION_TYPES) => {
    switch (type) {
      case "promotion":
        return COLORS.error;
      case "stock_alert":
        return COLORS.warning;
      case "order":
        return COLORS.info;
      case "system":
        return COLORS.textSecondary;
      case "product":
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notification</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderNotificationContent = () => {
    if (!notification) return null;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Header */}
        <View style={styles.notificationHeader}>
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: getNotificationColor(notification.type) },
            ]}
          >
            <Ionicons
              name={getNotificationIcon(notification.type) as any}
              size={32}
              color={COLORS.white}
            />
          </View>

          <View style={styles.notificationMeta}>
            <Text style={styles.notificationType}>
              {NOTIFICATION_TYPES[notification.type]}
            </Text>
            <Text style={styles.notificationDate}>
              {formatDate(notification.created_at)}
            </Text>
          </View>
        </View>

        {/* Notification Image */}
        {notification.data?.image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: optimizeImageUrl(notification.data.image_url, 300, 200),
              }}
              style={styles.notificationImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Notification Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>

          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </View>

        {/* Action Button */}
        {notification.data && (
          <View style={styles.actionContainer}>
            <Button
              title={getActionButtonText()}
              onPress={handleAction}
              fullWidth
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const getActionButtonText = () => {
    if (!notification?.data) return "View More";

    const { product_id, promotion_id, order_id } = notification.data;

    if (product_id) return "View Product";
    if (promotion_id) return "View Promotion";
    if (order_id) return "View Order";
    return "View More";
  };

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading notification">
        {null}
      </LoadingState>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.error}
          />
          <Text style={styles.errorTitle}>Notification not found</Text>
          <Text style={styles.errorSubtitle}>
            The notification you're looking for doesn't exist or has been
            deleted
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backToNotificationsButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderNotificationContent()}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  notificationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationType: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  notificationDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  imageContainer: {
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  notificationImage: {
    width: "100%",
    height: 200,
  },
  contentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  notificationTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  actionContainer: {
    marginBottom: SPACING.xl,
  },
  actionButton: {
    alignSelf: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  backToNotificationsButton: {
    alignSelf: "center",
  },
});

export default NotificationDetailsScreen;
