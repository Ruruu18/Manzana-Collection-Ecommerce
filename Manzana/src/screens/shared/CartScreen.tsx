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
  Modal,
  ScrollView,
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
import { Promotion } from '../../types';
import { CartItem } from '../../services/cart';
import { supabase } from '../../services/supabase';
import { ListSkeleton } from '../../components/Skeleton';
import { EmptyCart } from '../../components/EmptyState';

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
    updateVariantsAsync,
    removeFromCartAsync,
  } = useCartStore();

  // Edit variants modal state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
  const [loadingVariants, setLoadingVariants] = useState(false);

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
      const variantAdjustment = item.product_variants?.[0]?.price_adjustment || 0;
      return total + (finalPrice + variantAdjustment) * item.quantity;
    }, 0);
  }, [cartItems, activePromotions]);

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast.warning('Empty Cart', 'Please add items to your cart first');
      return;
    }

    // Check for out-of-stock items
    const outOfStockItems = cartItems.filter(item => !item.product || item.product.stock_quantity === 0);
    if (outOfStockItems.length > 0) {
      Alert.alert(
        'Items Unavailable',
        'Some items in your cart are out of stock. Please remove them before checking out.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to checkout
    navigation.navigate('Checkout' as never);
  }, [cartItems, navigation]);

  const openEditVariants = useCallback(async (item: CartItem) => {
    if (!item.product_id) return;

    setLoadingVariants(true);
    setEditingItem(item);

    try {
      // Fetch all available variants for this product
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('is_active', true)
        .order('type')
        .order('value');

      if (error) throw error;

      setAvailableVariants(variants || []);

      // Set currently selected variants
      const selected: Record<string, any> = {};
      (item.product_variants || []).forEach((variant: any) => {
        selected[variant.type] = variant;
      });
      setSelectedVariants(selected);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load variants');
      setEditingItem(null);
    } finally {
      setLoadingVariants(false);
    }
  }, []);

  const handleSelectVariant = useCallback((variant: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variant.type]: variant,
    }));
  }, []);

  const handleSaveVariants = useCallback(async () => {
    if (!editingItem || !user?.id) return;

    const variantIds = Object.values(selectedVariants).map((v: any) => v.id);

    if (variantIds.length === 0) {
      toast.error('Please select at least one variant');
      return;
    }

    setUpdating(editingItem.id);
    const { error } = await updateVariantsAsync(editingItem.id, variantIds);

    if (error) {
      toast.error('Failed to update variants');
    } else {
      toast.success('Variants updated');
      setEditingItem(null);
      setSelectedVariants({});
      setAvailableVariants([]);
    }

    setUpdating(null);
  }, [editingItem, selectedVariants, updateVariantsAsync, user?.id]);

  const closeEditModal = useCallback(() => {
    setEditingItem(null);
    setSelectedVariants({});
    setAvailableVariants([]);
  }, []);

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const product = item.product;
    const primaryImage = product?.images?.find((img: any) => img.is_primary) || product?.images?.[0];

    // Calculate price with promotions
    const priceInfo = product ? getProductFinalPrice(product, activePromotions) : { finalPrice: 0, originalPrice: 0, hasDiscount: false, hasPromotion: false };
    // Add all variant price adjustments
    const variantAdjustment = (item.product_variants || []).reduce((sum: number, v: any) => sum + (v.price_adjustment || 0), 0);
    const price = priceInfo.finalPrice + variantAdjustment;
    const originalPrice = priceInfo.originalPrice;
    const hasDiscount = priceInfo.hasDiscount || priceInfo.hasPromotion;
    const isUpdating = updating === item.id;
    const itemTotal = price * item.quantity;

    // Check if product is out of stock
    const isOutOfStock = !product || product.stock_quantity === 0;

    return (
      <View style={[styles.cartItem, isOutOfStock && styles.cartItemOutOfStock]}>
        {/* Product Image with Discount Badge */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: primaryImage?.url || 'https://via.placeholder.com/100' }}
            style={styles.productImage}
            resizeMode="cover"
            accessibilityLabel={`${product?.name} product image`}
            accessibilityRole="image"
          />
          {hasDiscount && !isOutOfStock && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>SALE</Text>
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockBadgeText}>Not Available</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.name || 'Product'}
          </Text>

          {/* Variant Info */}
          {item.product_variants && item.product_variants.length > 0 && (
            <View style={styles.variantContainer}>
              <View style={styles.variantInfo}>
                {item.product_variants.map((variant: any, index: number) => (
                  <View key={variant.id} style={{ flexDirection: 'row', alignItems: 'center', marginRight: SPACING.sm }}>
                    <Text style={styles.variantText}>
                      {variant.type.charAt(0).toUpperCase() + variant.type.slice(1)}: {variant.value}
                    </Text>
                    {variant.price_adjustment !== 0 && (
                      <Text style={styles.variantPrice}>
                        {' '}({variant.price_adjustment > 0 ? '+' : ''}
                        {formatCurrency(variant.price_adjustment)})
                      </Text>
                    )}
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.editVariantButton}
                onPress={() => openEditVariants(item)}
                disabled={isUpdating}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.editVariantText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}

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
                style={[styles.quantityButton, (isUpdating || isOutOfStock) && styles.quantityButtonDisabled]}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={isUpdating || isOutOfStock}
                accessibilityLabel={A11Y_LABELS.DECREASE_QUANTITY}
                accessibilityHint={A11Y_HINTS.DECREASE_QUANTITY(item.quantity)}
                accessibilityRole="button"
              >
                <Ionicons name="remove" size={18} color={(isUpdating || isOutOfStock) ? COLORS.textSecondary : COLORS.primary} />
              </TouchableOpacity>

              <Text
                style={[styles.quantityText, isOutOfStock && styles.quantityTextDisabled]}
                accessibilityLabel={`Quantity: ${item.quantity}`}
              >
                {item.quantity}
              </Text>

              <TouchableOpacity
                style={[styles.quantityButton, (isUpdating || isOutOfStock || item.quantity >= (product?.stock_quantity || 0)) && styles.quantityButtonDisabled]}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating || isOutOfStock || item.quantity >= (product?.stock_quantity || 0)}
                accessibilityLabel={A11Y_LABELS.INCREASE_QUANTITY}
                accessibilityHint={A11Y_HINTS.INCREASE_QUANTITY(item.quantity)}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color={(isUpdating || isOutOfStock || item.quantity >= (product?.stock_quantity || 0)) ? COLORS.textSecondary : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Item Total */}
            <Text style={styles.itemTotal}>{formatCurrency(itemTotal)}</Text>
          </View>

          {/* Stock Warning/Status */}
          {isOutOfStock ? (
            <View style={styles.outOfStockBanner}>
              <Ionicons name="close-circle" size={14} color={COLORS.error} />
              <Text style={styles.outOfStockText}>
                Out of Stock - Item unavailable
              </Text>
            </View>
          ) : product?.stock_quantity && product.stock_quantity <= 5 && (
            <View style={styles.stockWarningContainer}>
              <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
              <Text style={styles.stockWarning}>
                Low Stock - Only {product.stock_quantity} left!
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

  const handleStartShopping = () => {
    // Navigate back first, then jump to Catalog tab
    navigation.goBack();
    // Use a timeout to ensure the back navigation completes first
    setTimeout(() => {
      (navigation as any).getParent()?.navigate('Catalog');
    }, 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={A11Y_LABELS.BACK_BUTTON}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerRight} />
        </View>
        <ListSkeleton type="product" count={3} />
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
        <EmptyCart
          actionLabel="Start Shopping"
          onAction={handleStartShopping}
        />
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

      {/* Edit Variants Modal */}
      <Modal
        visible={editingItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Variants</Text>
              <TouchableOpacity onPress={closeEditModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {loadingVariants ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.modalLoadingText}>Loading variants...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {editingItem?.product && (
                  <View style={styles.modalProductInfo}>
                    <Text style={styles.modalProductName}>{editingItem.product.name}</Text>
                  </View>
                )}

                {/* Group variants by type */}
                {Object.entries(
                  availableVariants.reduce((acc: any, variant: any) => {
                    if (!acc[variant.type]) acc[variant.type] = [];
                    acc[variant.type].push(variant);
                    return acc;
                  }, {})
                ).map(([type, variants]: [string, any]) => (
                  <View key={type} style={styles.variantTypeGroup}>
                    <Text style={styles.variantTypeLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    <View style={styles.variantOptionsGrid}>
                      {variants.map((variant: any) => {
                        const isSelected = selectedVariants[type]?.id === variant.id;
                        return (
                          <TouchableOpacity
                            key={variant.id}
                            style={[
                              styles.variantOption,
                              isSelected && styles.variantOptionSelected,
                            ]}
                            onPress={() => handleSelectVariant(variant)}
                          >
                            <Text
                              style={[
                                styles.variantOptionText,
                                isSelected && styles.variantOptionTextSelected,
                              ]}
                            >
                              {variant.value}
                            </Text>
                            {variant.price_adjustment !== 0 && (
                              <Text
                                style={[
                                  styles.variantOptionPrice,
                                  isSelected && styles.variantOptionPriceSelected,
                                ]}
                              >
                                {variant.price_adjustment > 0 ? '+' : ''}
                                {formatCurrency(variant.price_adjustment)}
                              </Text>
                            )}
                            {isSelected && (
                              <View style={styles.variantSelectedIcon}>
                                <Ionicons name="checkmark" size={16} color={COLORS.white} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeEditModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  updating === editingItem?.id && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleSaveVariants}
                disabled={updating === editingItem?.id}
              >
                {updating === editingItem?.id ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  variantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  variantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  variantText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  variantPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  editVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  editVariantText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
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
  cartItemOutOfStock: {
    opacity: 0.6,
    backgroundColor: COLORS.surface,
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  outOfStockBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
  },
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  outOfStockText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
  quantityTextDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.5,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  modalLoadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  modalProductInfo: {
    marginBottom: SPACING.lg,
  },
  modalProductName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  variantTypeGroup: {
    marginBottom: SPACING.lg,
  },
  variantTypeLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  variantOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  variantOption: {
    minWidth: 80,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
  },
  variantOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  variantOptionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
  },
  variantOptionTextSelected: {
    color: COLORS.white,
  },
  variantOptionPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  variantOptionPriceSelected: {
    color: COLORS.white,
  },
  variantSelectedIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default CartScreen;
