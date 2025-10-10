import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency, formatDateTime } from '../../utils';
import LoadingState from '../../components/LoadingState';

interface OrderTrackingScreenProps {
  navigation: any;
  route: any;
}

interface OrderStatus {
  status: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: 'receipt-outline' },
    { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
    { key: 'processing', label: 'Preparing', icon: 'construct-outline' },
    { key: 'shipped', label: 'Ready for Pickup', icon: 'bag-check-outline' },
    { key: 'delivered', label: 'Picked Up', icon: 'checkmark-done-circle-outline' },
  ];

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              product_images (url, is_primary)
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Order Tracking</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderOrderInfo = () => (
    <View style={styles.orderInfoCard}>
      <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
      <Text style={styles.orderDate}>
        Placed on {formatDateTime(order.created_at)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Amount:</Text>
        <Text style={styles.infoValue}>{formatCurrency(order.total_amount)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Payment Status:</Text>
        <Text
          style={[
            styles.infoValue,
            {
              color:
                order.payment_status === 'paid'
                  ? COLORS.success
                  : COLORS.warning,
            },
          ]}
        >
          {order.payment_status.toUpperCase()}
        </Text>
      </View>

      {order.pickup_date && (
        <View style={styles.pickupInfoContainer}>
          <Text style={styles.infoLabel}>Pickup Schedule:</Text>
          <View style={styles.pickupDetails}>
            <View style={styles.pickupRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: SPACING.xs }} />
              <Text style={[styles.pickupText, { color: COLORS.primary, fontWeight: '600' }]}>
                {new Date(order.pickup_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            {order.pickup_time && (
              <View style={styles.pickupRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} style={{ marginRight: SPACING.xs }} />
                <Text style={[styles.pickupText, { color: COLORS.primary, fontWeight: '600' }]}>
                  {order.pickup_time}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderTrackingSteps = () => (
    <View style={styles.trackingContainer}>
      <Text style={styles.sectionTitle}>Order Status</Text>

      {statusSteps.map((step, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const isLast = index === statusSteps.length - 1;

        return (
          <View key={step.key}>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <View
                  style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isCurrent && styles.stepIconCurrent,
                  ]}
                >
                  <Ionicons
                    name={step.icon as any}
                    size={20}
                    color={isCompleted ? COLORS.white : COLORS.textSecondary}
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
                {isCurrent && (
                  <Text style={styles.stepDescription}>
                    Your order is currently {step.label.toLowerCase()}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderOrderItems = () => (
    <View style={styles.itemsContainer}>
      <Text style={styles.sectionTitle}>Order Items</Text>

      {order.order_items.map((item: any) => (
        <View key={item.id} style={styles.orderItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          </View>
          <Text style={styles.itemPrice}>
            {formatCurrency(item.total_price)}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>
          {formatCurrency(order.subtotal)}
        </Text>
      </View>


      {order.discount_amount > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: COLORS.success }]}>
            Discount:
          </Text>
          <Text style={[styles.totalValue, { color: COLORS.success }]}>
            -{formatCurrency(order.discount_amount)}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.grandTotalLabel}>Total:</Text>
        <Text style={styles.grandTotalValue}>
          {formatCurrency(order.total_amount)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading order details">
        {null}
      </LoadingState>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderOrderInfo()}
        {renderTrackingSteps()}
        {renderOrderItems()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  orderInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  orderNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  orderDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  pickupInfoContainer: {
    marginBottom: SPACING.sm,
  },
  pickupDetails: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    flexWrap: 'wrap',
  },
  trackingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stepIconCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepIconCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  stepLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stepLabelCompleted: {
    color: COLORS.text,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  stepDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  totalValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  grandTotalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  grandTotalValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
});

export default OrderTrackingScreen;
