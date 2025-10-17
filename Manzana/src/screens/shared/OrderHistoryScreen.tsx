import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { cartService } from "../../services/cart";
import { useAuth } from "../../hooks/useAuth";
import { useFocusEffect } from "@react-navigation/native";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  ORDER_STATUS,
} from "../../constants/theme";
import { formatCurrency, formatDate, getErrorMessage } from "../../utils";
import LoadingState from "../../components/LoadingState";
import ListSkeleton from "../../components/ListSkeleton";
import Button from "../../components/Button";

const { width } = Dimensions.get('window');

interface Order {
  id: string;
  order_number: string;
  status: keyof typeof ORDER_STATUS;
  total_amount: number;
  created_at: string;
  pickup_date?: string;
  pickup_time?: string;
  order_items?: any[];
  shipping_address?: any;
  estimated_delivery?: string;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollPositionRef = React.useRef(0);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  // Reload when filter changes
  useEffect(() => {
    if (user) {
      loadOrders().then(() => {
        // Restore scroll position after loading
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: scrollPositionRef.current,
            animated: false,
          });
        }, 50);
      });
    }
  }, [selectedStatus]);

  const loadOrders = async (resetPage = true) => {
    if (!user) return;

    try {
      if (resetPage) {
        setLoading(true);
        setPage(1);
        setOrders([]);
      }
      setError(null);

      const currentPage = resetPage ? 1 : page;
      const pageSize = 20;
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            variant_ids,
            quantity,
            products (
              name,
              product_images (url, is_primary)
            )
          )
        `,
          { count: 'exact' }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      if (resetPage) {
        setOrders(data || []);
      } else {
        setOrders(prev => [...prev, ...(data || [])]);
      }

      setHasMore(count ? to < count - 1 : false);
      if (!resetPage) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadOrders(false);
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
        return "bag-check-outline"; // Ready for pickup
      case "delivered":
        return "checkmark-done-circle-outline"; // Picked up/Completed
      case "cancelled":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const handleReorder = async (order: Order) => {
    if (!user || !order.order_items) return;

    try {
      setReorderingId(order.id);
      let addedCount = 0;
      let failedCount = 0;

      // Add each item from the order to cart
      for (const item of order.order_items) {
        const result = await cartService.addToCart(
          user.id,
          item.product_id,
          item.quantity,
          item.variant_ids || []
        );

        if (result.error) {
          failedCount++;
        } else {
          addedCount++;
        }
      }

      if (addedCount > 0) {
        Alert.alert(
          'Items Added to Cart',
          `Successfully added ${addedCount} item(s) to your cart.${failedCount > 0 ? ` ${failedCount} item(s) could not be added.` : ''}`,
          [
            {
              text: 'Continue Shopping',
              style: 'cancel',
            },
            {
              text: 'View Cart',
              onPress: () => navigation.navigate('Cart'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Reorder Failed',
          'Could not add items to cart. Some products may no longer be available.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Error reordering:', err);
      Alert.alert('Error', 'Failed to reorder. Please try again.');
    } finally {
      setReorderingId(null);
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
      <Text style={styles.headerTitle}>Orders</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const filterData = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "delivered", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        onScroll={(event) => {
          scrollPositionRef.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {filterData.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterButton,
              selectedStatus === item.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(item.key)}
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
        ))}
      </ScrollView>
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
            {(() => {
              const totalQty = item.order_items?.reduce((total, orderItem) => total + orderItem.quantity, 0) || 0;
              return `${totalQty} ${totalQty === 1 ? "item" : "items"}`;
            })()}
          </Text>
          <Text style={styles.orderTotal}>
            {formatCurrency(item.total_amount)}
          </Text>
        </View>

        {item.pickup_date && (
          <Text style={styles.deliveryInfo}>
            Pickup: {formatDate(item.pickup_date)} at {item.pickup_time}
          </Text>
        )}
      </View>

      <View style={styles.orderActions}>
        <Button
          title="View Details"
          onPress={() => {
            navigation.navigate('OrderDetails', { orderId: item.id });
          }}
          size="small"
          variant="outline"
          style={styles.actionButton}
          icon="receipt-outline"
        />

        <Button
          title="Track"
          onPress={() => {
            navigation.navigate('OrderTracking', { orderId: item.id });
          }}
          size="small"
          variant="outline"
          style={styles.actionButton}
          icon="location-outline"
        />

        {item.status === "delivered" && (
          <Button
            title={reorderingId === item.id ? "Adding..." : "Reorder"}
            onPress={() => handleReorder(item)}
            disabled={reorderingId === item.id}
            size="small"
            style={styles.actionButton}
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        {renderStatusFilter()}
        <ListSkeleton count={5} itemHeight={120} />
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <LoadingState
          loading={false}
          error={error}
          onRetry={loadOrders}
        >
          {null}
        </LoadingState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
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
    gap: SPACING.sm,
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
    flexWrap: "wrap",
  },
  orderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flexWrap: "wrap",
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
    flexWrap: "wrap",
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
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
  loadingMore: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingMoreText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

export default OrderHistoryScreen;
