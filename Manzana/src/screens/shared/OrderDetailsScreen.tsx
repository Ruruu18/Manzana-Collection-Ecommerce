import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { cartService } from '../../services/cart';
import { reviewsService } from '../../services/reviews';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils';
import Button from '../../components/Button';
import ReviewModal from '../../components/ReviewModal';
import { useAuth } from '../../hooks/useAuth';

interface OrderDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reviewableProducts, setReviewableProducts] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
            products (
              id,
              name,
              price,
              product_images (url, is_primary)
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);

      // Load reviewable products if order is delivered/completed
      if (user && (data.status === 'delivered' || data.status === 'completed')) {
        const { data: products } = await reviewsService.getReviewableProductsFromOrder(
          user.id,
          orderId
        );
        setReviewableProducts(products || []);
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'confirmed': return COLORS.info;
      case 'processing': return COLORS.primary;
      case 'shipped': return COLORS.accent;
      case 'delivered': return COLORS.success;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleReorder = async () => {
    if (!user || !order?.order_items) return;

    try {
      setReordering(true);
      let addedCount = 0;
      let failedCount = 0;

      // Add each item from the order to cart
      for (const item of order.order_items) {
        const result = await cartService.addToCart(
          user.id,
          item.product_id,
          item.quantity,
          item.product_variant_id
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
      setReordering(false);
    }
  };

  const handleReviewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Reload reviewable products to update the list
    if (user) {
      reviewsService.getReviewableProductsFromOrder(user.id, orderId).then(({ data }) => {
        setReviewableProducts(data || []);
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#{order.order_number}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date:</Text>
            <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
          </View>

          {order.pickup_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup Date:</Text>
              <Text style={[styles.infoValue, styles.pickupDate]}>
                {formatDate(order.pickup_date)} at {order.pickup_time}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>
              {order.payment_method_pickup === 'cash' ? 'Cash on Pickup' : order.payment_method_pickup}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status:</Text>
            <Text style={[styles.infoValue, { color: order.payment_status === 'paid' ? COLORS.success : COLORS.warning }]}>
              {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Order Items ({order.order_items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0})
          </Text>

          {order.order_items?.map((item: any, index: number) => {
            const primaryImage = item.products?.product_images?.find((img: any) => img.is_primary) ||
              item.products?.product_images?.[0];

            return (
              <View key={index} style={styles.orderItem}>
                {primaryImage ? (
                  <Image
                    source={{ uri: primaryImage.url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color={COLORS.textSecondary} />
                  </View>
                )}

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.products?.name || 'Product'}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(item.unit_price)} x {item.quantity}
                  </Text>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.total_price)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Pickup Information */}
        {order.shipping_address && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Information</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addressText}>{order.shipping_address.fullName}</Text>
            </View>
            <View style={styles.addressContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addressText}>{order.shipping_address.phone}</Text>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
          </View>

          {order.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                -{formatCurrency(order.discount_amount)}
              </Text>
            </View>
          )}

          {order.tax_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.tax_amount)}</Text>
            </View>
          )}

          {order.shipping_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.shipping_amount)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.pickup_notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.pickup_notes}</Text>
          </View>
        )}

        {/* Review Products Section */}
        {reviewableProducts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.reviewHeader}>
              <Ionicons name="star" size={24} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Review Your Products</Text>
            </View>
            <Text style={styles.reviewSubtitle}>
              Share your experience to help other customers
            </Text>

            {reviewableProducts.map((product, index) => (
              <View key={product.productId} style={styles.reviewableProduct}>
                {product.productImage ? (
                  <Image
                    source={{ uri: product.productImage }}
                    style={styles.reviewProductImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.reviewProductImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color={COLORS.textSecondary} />
                  </View>
                )}

                <View style={styles.reviewProductDetails}>
                  <Text style={styles.reviewProductName} numberOfLines={2}>
                    {product.productName}
                  </Text>

                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => handleReviewProduct(product)}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.writeReviewText}>Write Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Review Modal */}
      {selectedProduct && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          productImage={selectedProduct.productImage}
          userId={user?.id || ''}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <Button
          title="Track Order"
          onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
          icon="location-outline"
          variant="outline"
          style={styles.actionButton}
        />

        {order.status === 'delivered' && (
          <Button
            title={reordering ? "Adding to Cart..." : "Reorder"}
            onPress={handleReorder}
            disabled={reordering}
            style={styles.actionButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginVertical: SPACING.lg,
    textAlign: 'center',
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  orderNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    flexShrink: 0,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  infoLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  pickupDate: {
    color: COLORS.success,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  itemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  itemPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  notesText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  reviewSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  reviewableProduct: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewProductImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  reviewProductImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewProductDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  reviewProductName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  writeReviewText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
  },
});

export default OrderDetailsScreen;
