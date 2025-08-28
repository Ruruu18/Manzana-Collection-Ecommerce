import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
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
  ORDER_STATUS,
} from "../../constants/theme";
import { formatCurrency, formatDate } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

interface Order {
  id: string;
  order_number: string;
  status: keyof typeof ORDER_STATUS;
  total_amount: number;
  created_at: string;
  items_count: number;
  shipping_address: string;
  estimated_delivery: string;
}

interface OrderHistoryScreenProps {
  navigation: any;
}

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          total_amount,
          created_at,
          items_count,
          shipping_address,
          estimated_delivery
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: keyof typeof ORDER_STATUS) => {
    switch (status) {
      case "pending":
        return COLORS.warning;
      case "confirmed":
        return COLORS.info;
      case "processing":
        return COLORS.primary;
      case "shipped":
        return COLORS.accent;
      case "delivered":
        return COLORS.success;
      case "cancelled":
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: keyof typeof ORDER_STATUS) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "confirmed":
        return "checkmark-circle-outline";
      case "processing":
        return "construct-outline";
      case "shipped":
        return "car-outline";
      case "delivered":
        return "checkmark-done-circle-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
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
      <Text style={styles.headerTitle}>Order History</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        data={[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "processing", label: "Processing" },
          { key: "shipped", label: "Shipped" },
          { key: "delivered", label: "Delivered" },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedStatus === item.key && styles.filterButtonActive,
            ]}
            onPress={() => {
              setSelectedStatus(item.key);
              loadOrders();
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === item.key && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item.key}
      />
    </View>
  );

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        // Navigate to order details
        // navigation.navigate('OrderDetails', { orderId: item.id });
      }}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={12}
            color={COLORS.white}
          />
          <Text style={styles.statusText}>{ORDER_STATUS[item.status]}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderMeta}>
          <Text style={styles.itemsCount}>
            {item.items_count} {item.items_count === 1 ? "item" : "items"}
          </Text>
          <Text style={styles.orderTotal}>
            {formatCurrency(item.total_amount)}
          </Text>
        </View>

        {item.estimated_delivery && item.status === "shipped" && (
          <Text style={styles.deliveryInfo}>
            Estimated delivery: {formatDate(item.estimated_delivery)}
          </Text>
        )}
      </View>

      <View style={styles.orderActions}>
        <Button
          title="View Details"
          onPress={() => {
            // Navigate to order details
            // navigation.navigate('OrderDetails', { orderId: item.id });
          }}
          size="small"
          variant="outline"
          style={styles.detailsButton}
        />

        {item.status === "delivered" && (
          <Button
            title="Reorder"
            onPress={() => {
              // Add items to cart again
            }}
            size="small"
            style={styles.reorderButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>You have no orders</Text>
      <Text style={styles.emptySubtitle}>
        When you make your first purchase, it will appear here
      </Text>
      <Button
        title="Explore Products"
        onPress={() => navigation.navigate("Catalog")}
        style={styles.exploreButton}
      />
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading order history">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderStatusFilter()}

      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        />
      ) : (
        renderEmptyState()
      )}
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
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterList: {
    paddingHorizontal: SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.lg,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: SPACING.md,
  },
  orderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  itemsCount: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  deliveryInfo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: "500",
  },
  orderActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  detailsButton: {
    flex: 1,
  },
  reorderButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  exploreButton: {
    alignSelf: "center",
  },
});

export default OrderHistoryScreen;
