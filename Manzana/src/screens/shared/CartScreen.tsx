import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { A11Y_LABELS, A11Y_HINTS } from '../../constants/accessibility';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency, toast } from '../../utils';
import { fetchActivePromotions, getProductFinalPrice } from '../../utils/cartPromotionUtils';
import { Promotion, Cart as CartItem } from '../../types';

const { width } = Dimensions.get('window');
const ITEM_IMAGE_SIZE = width > 400 ? 100 : 80;

const CartScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);

  // Use Zustand store for cart state
  const {
    cart: cartItems,
    loading,
    loadCart,
    updateQuantityAsync,
    removeFromCartAsync,
  } = useCartStore();

  useEffect(() => {
    if (user?.id) {
      loadCart(user.id);
      loadPromotions();
    }
  }, [user?.id]);

  const loadPromotions = async () => {
    const promotions = await fetchActivePromotions();
    setActivePromotions(promotions);
  };

  const onRefresh = useCallback(async () => {
    if (user?.id) {
      setRefreshing(true);
      await loadCart(user.id);
      await loadPromotions();
      setRefreshing(false);
    }
  }, [user?.id, loadCart]);

  const updateQuantity = useCallback(async (cartItemId: string, newQuantity: number) => {
    try {
      setUpdating(cartItemId);

      if (newQuantity <= 0) {
        await removeItem(cartItemId);
        return;
      }

      const { error } = await updateQuantityAsync(cartItemId, newQuantity);

      if (error) {
        toast.error('Failed to update quantity');
      } else {
        toast.quantityUpdated();
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  }, [updateQuantityAsync]);

  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      setUpdating(cartItemId);
      const item = cartItems.find(i => i.id === cartItemId);
      const { error } = await removeFromCartAsync(cartItemId);

      if (error) {
        toast.error('Failed to remove item');
      } else {
        toast.removedFromCart(item?.product?.name);
      }
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  }, [cartItems, removeFromCartAsync]);

  const total = useMemo(() => {
    return cartItems.reduce((total, item) => {
      if (!item.product) return total;
      const { finalPrice } = getProductFinalPrice(item.product, activePromotions);
      return total + finalPrice * item.quantity;
    }, 0);
  }, [cartItems, activePromotions]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast.warning('Empty Cart', 'Please add items to your cart first');
      return;
    }

    // Navigate to checkout
    navigation.navigate('Checkout' as never);
  }, [cartItems.length, navigation]);

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const product = item.product;
    const primaryImage = product?.images?.find((img: any) => img.is_primary) || product?.images?.[0];

    // Calculate price with promotions
    const priceInfo = product ? getProductFinalPrice(product, activePromotions) : { finalPrice: 0, originalPrice: 0, hasDiscount: false, hasPromotion: false };
    const price = priceInfo.finalPrice;
    const originalPrice = priceInfo.originalPrice;
    const hasDiscount = priceInfo.hasDiscount || priceInfo.hasPromotion;
    const isUpdating = updating === item.id;
    const itemTotal = price * item.quantity;

    return (
      <View style={styles.cartItem}>
        {/* Product Image with Discount Badge */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: primaryImage?.url || 'https://via.placeholder.com/100' }}
            style={styles.productImage}
            resizeMode="cover"
            accessibilityLabel={`${product?.name} product image`}
            accessibilityRole="image"
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>SALE</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.name || 'Product'}
          </Text>

          {/* Price Section */}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatCurrency(price)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>
            )}
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, isUpdating && styles.quantityButtonDisabled]}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={isUpdating}
                accessibilityLabel={A11Y_LABELS.DECREASE_QUANTITY}
                accessibilityHint={A11Y_HINTS.DECREASE_QUANTITY(item.quantity)}
                accessibilityRole="button"
              >
                <Ionicons name="remove" size={18} color={isUpdating ? COLORS.textSecondary : COLORS.primary} />
              </TouchableOpacity>

              <Text
                style={styles.quantityText}
                accessibilityLabel={`Quantity: ${item.quantity}`}
              >
                {item.quantity}
              </Text>

              <TouchableOpacity
                style={[styles.quantityButton, (isUpdating || item.quantity >= (product?.stock_quantity || 0)) && styles.quantityButtonDisabled]}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating || item.quantity >= (product?.stock_quantity || 0)}
                accessibilityLabel={A11Y_LABELS.INCREASE_QUANTITY}
                accessibilityHint={A11Y_HINTS.INCREASE_QUANTITY(item.quantity)}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color={(isUpdating || item.quantity >= (product?.stock_quantity || 0)) ? COLORS.textSecondary : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Item Total */}
            <Text style={styles.itemTotal}>{formatCurrency(itemTotal)}</Text>
          </View>

          {/* Stock Warning */}
          {product?.stock_quantity && product.stock_quantity <= 5 && (
            <View style={styles.stockWarningContainer}>
              <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
              <Text style={styles.stockWarning}>
                Only {product.stock_quantity} left
              </Text>
            </View>
          )}
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
          disabled={isUpdating}
          accessibilityLabel={`${A11Y_LABELS.REMOVE_FROM_CART}, ${product?.name}`}
          accessibilityHint={A11Y_HINTS.REMOVE_FROM_CART}
          accessibilityRole="button"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Ionicons name="close" size={20} color={COLORS.error} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some items to get started
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home' as never)}
        accessibilityLabel="Start shopping"
        accessibilityHint="Double tap to go to home and browse products"
        accessibilityRole="button"
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={A11Y_LABELS.BACK_BUTTON}
            accessibilityHint={A11Y_HINTS.GO_BACK}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerRight} />
        </View>
        {renderEmptyCart()}
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
          accessibilityLabel={A11Y_LABELS.BACK_BUTTON}
          accessibilityHint={A11Y_HINTS.GO_BACK}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text
            style={styles.headerTitle}
            accessibilityRole="header"
          >
            Shopping Cart
          </Text>
          <Text style={styles.headerSubtitle}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Cart Items List */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Bottom Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryNote}>Taxes and fees calculated at checkout</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          accessibilityLabel={A11Y_LABELS.CHECKOUT}
          accessibilityHint={A11Y_HINTS.CHECKOUT(cartItems.length, formatCurrency(total))}
          accessibilityRole="button"
        >
          <Ionicons name="cart" size={22} color={COLORS.white} />
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    marginRight: SPACING.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  headerSpacer: {
    width: 40,
  },
  headerRight: {
    width: 40,
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
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    paddingRight: SPACING.xl + 16, // Extra space for remove button
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: ITEM_IMAGE_SIZE,
    height: ITEM_IMAGE_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.xs,
    justifyContent: 'space-between',
    minWidth: 0, // Important for text truncation
  },
  productName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  productPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    marginHorizontal: SPACING.sm,
    minWidth: 24,
    textAlign: 'center',
    color: COLORS.text,
  },
  itemTotal: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: width < 380 ? 16 : 18, // Smaller on very small screens
  },
  stockWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  stockWarning: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  shopButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  summaryContent: {
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  summaryValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  summaryNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CartScreen;
