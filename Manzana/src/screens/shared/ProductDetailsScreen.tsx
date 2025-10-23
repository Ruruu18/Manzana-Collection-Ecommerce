import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import ImageView from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore } from '../../store/cartStore';
import { useProduct, useSimilarProducts } from '../../hooks/useProductQueries';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { useActivePromotions } from '../../hooks/useProductsWithPromotions';
import { calculatePromotionPrice } from '../../utils/promotionUtils';
import { formatCurrency, calculateDiscountPercentage, toast, getCategoryIcon } from '../../utils';
import { ProductDetailsScreenProps, Product, HomeStackParamList, ProductVariant } from '../../types';
import { cartService } from '../../services/cart';
import { supabase } from '../../services/supabase';
import ProductReviewsSection from '../../components/ProductReviewsSection';
import { VariantSelector } from '../../components/VariantSelector';

const { width } = Dimensions.get('window');

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ route, navigation: navProp }) => {
  const navigation = navProp || useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user } = useAuth();
  const { productId } = route.params;

  // React Query hooks for data fetching with caching
  const { data: product, isLoading: loading, error: productError, refetch } = useProduct(productId);
  const { data: similarProducts = [] } = useSimilarProducts(productId, product?.category_id);
  const { addRecentProduct } = useRecentlyViewed();

  // Fetch active promotions to apply to product pricing
  const { data: activePromotions = [] } = useActivePromotions(user?.user_type);

  // Force refetch product data when productId changes
  useEffect(() => {
    refetch();
    // Reset selected image and variants when productId changes
    setSelectedImage(0);
    setSelectedVariants({});
  }, [productId, refetch]);

  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [modalAction, setModalAction] = useState<'add' | 'buy'>('add');
  const [hasStockAlert, setHasStockAlert] = useState(false);
  const [checkingAlert, setCheckingAlert] = useState(false);
  const [settingAlert, setSettingAlert] = useState(false);
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: ProductVariant }>({});

  // Use Zustand store for cart
  const { cartCount, addToCartAsync } = useCartStore();

  // Memoize images array for ImageView component (must be before any returns)
  const imageViewImages = useMemo(() => {
    if (!product?.images) return [];
    return product.images.map(img => ({ uri: img.url }));
  }, [product?.images]);

  // Handle variant selection (must be before any returns)
  const handleSelectVariant = useCallback((variant: ProductVariant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variant.type]: variant
    }));
  }, []);

  // Show error toast if product fails to load
  useEffect(() => {
    if (productError) {
      toast.error('Failed to load product details');
    }
  }, [productError]);

  // Track recently viewed product
  useEffect(() => {
    if (product) {
      addRecentProduct(product);
    }
  }, [product]);

  // Check if user has stock alert for this product
  const checkStockAlert = useCallback(async () => {
    if (!user || !product) return;

    setCheckingAlert(true);
    try {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setHasStockAlert(true);
      } else {
        setHasStockAlert(false);
      }
    } catch (error) {
      console.error('Error checking stock alert:', error);
    } finally {
      setCheckingAlert(false);
    }
  }, [user, product]);

  useEffect(() => {
    checkStockAlert();
  }, [checkStockAlert]);

  // Refresh stock alert status when screen comes into focus
  // (e.g., when user taps notification and navigates here)
  useFocusEffect(
    useCallback(() => {
      checkStockAlert();
    }, [checkStockAlert])
  );

  const handleAddToCart = useCallback(() => {
    if (!user) {
      toast.warning('Login Required', 'Please login to add items to cart');
      return;
    }

    if (!product) return;

    if (product.stock_quantity === 0) {
      toast.error('Out of Stock', 'This product is currently unavailable');
      return;
    }

    // Check if product has variants and if they're all selected
    if (product.variants && product.variants.length > 0) {
      const variantTypes = [...new Set(product.variants.map(v => v.type))];
      const selectedTypes = Object.keys(selectedVariants);
      const missingTypes = variantTypes.filter(type => !selectedTypes.includes(type));

      if (missingTypes.length > 0) {
        const missingTypesFormatted = missingTypes
          .map(t => t.charAt(0).toUpperCase() + t.slice(1))
          .join(', ');
        toast.warning(
          'Select Variants',
          `Please select ${missingTypesFormatted} before adding to cart`
        );
        return;
      }
    }

    // Show modal to select quantity
    setModalAction('add');
    setQuantity(1);
    setShowQuantityModal(true);
  }, [user, product, selectedVariants]);

  const confirmAddToCart = useCallback(async () => {
    if (!user || !product) return;

    if (quantity > product.stock_quantity) {
      toast.error('Insufficient Stock', `Only ${product.stock_quantity} available`);
      return;
    }

    try {
      setAddingToCart(true);
      setShowQuantityModal(false);

      // Get all selected variant IDs
      const variantIds = Object.values(selectedVariants).map(v => v.id);

      // Use Zustand store with optimistic update
      const { error } = await addToCartAsync(user.id, product.id, quantity, variantIds.length > 0 ? variantIds : undefined);

      if (error) {
        toast.error(error);
        return;
      }

      // Success - show toast notification
      toast.addedToCart(product.name);
      setJustAdded(true);
      setQuantity(1);

      // Reset visual feedback after 2 seconds
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  }, [user, product, quantity, selectedVariants, addToCartAsync]);

  const increaseQuantity = useCallback(() => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  }, [product, quantity]);

  const decreaseQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  }, [quantity]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      toast.warning('Login Required', 'Please login to continue');
      return;
    }

    if (!product) return;

    if (product.stock_quantity === 0) {
      toast.error('Out of Stock', 'This product is currently unavailable');
      return;
    }

    // Check if product has variants and if they're all selected
    if (product.variants && product.variants.length > 0) {
      const variantTypes = [...new Set(product.variants.map(v => v.type))];
      const selectedTypes = Object.keys(selectedVariants);
      const missingTypes = variantTypes.filter(type => !selectedTypes.includes(type));

      if (missingTypes.length > 0) {
        const missingTypesFormatted = missingTypes
          .map(t => t.charAt(0).toUpperCase() + t.slice(1))
          .join(', ');
        toast.warning(
          'Select Variants',
          `Please select ${missingTypesFormatted} before buying`
        );
        return;
      }
    }

    // Show modal to select quantity
    setModalAction('buy');
    setQuantity(1);
    setShowQuantityModal(true);
  }, [user, product, selectedVariants]);

  const confirmBuyNow = async () => {
    if (!user || !product) return;

    if (quantity > product.stock_quantity) {
      toast.error('Insufficient Stock', `Only ${product.stock_quantity} available`);
      return;
    }

    try {
      setAddingToCart(true);
      setShowQuantityModal(false);

      // Get all selected variant IDs
      const variantIds = Object.values(selectedVariants).map(v => v.id);

      // Add to cart first
      const { error } = await cartService.addToCart(user.id, product.id, quantity, variantIds.length > 0 ? variantIds : undefined);

      if (error) {
        toast.error(error);
        return;
      }

      // Navigate directly to checkout
      (navigation as any).navigate('Checkout');
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error('Failed to proceed. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleNotifyMe = useCallback(async () => {
    if (!user) {
      toast.warning('Login Required', 'Please login to set stock alerts');
      return;
    }

    if (!product) return;

    setSettingAlert(true);
    try {
      if (hasStockAlert) {
        // Remove stock alert
        const { error } = await supabase
          .from('stock_alerts')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;

        toast.success('Stock alert removed');
      } else {
        // Create stock alert (upsert to handle duplicate key constraint)
        const { error } = await supabase
          .from('stock_alerts')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            threshold_quantity: 10, // Notify when stock is restocked above 10
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,product_id'
          });

        if (error) throw error;

        toast.success('Stock alert set! We\'ll notify you when this item is back in stock.');
      }

      // Refresh stock alert status
      await checkStockAlert();
    } catch (error) {
      console.error('Error setting stock alert:', error);
      toast.error('Failed to set stock alert. Please try again.');
    } finally {
      setSettingAlert(false);
    }
  }, [user, product, hasStockAlert, checkStockAlert]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Apply active promotions to product pricing
  const priceResult = calculatePromotionPrice(product, activePromotions);
  const effectiveDiscountedPrice = priceResult.appliedPromotion
    ? priceResult.finalPrice
    : product.discounted_price;

  const hasDiscount = (effectiveDiscountedPrice && effectiveDiscountedPrice < product.price) || priceResult.appliedPromotion !== null;
  const discountPercentage = hasDiscount
    ? priceResult.appliedPromotion
      ? Math.round(priceResult.savingsPercentage)
      : calculateDiscountPercentage(product.price, effectiveDiscountedPrice!)
    : 0;

  // Calculate price with variant adjustments
  const variantPriceAdjustment = Object.values(selectedVariants).reduce(
    (sum, variant) => sum + (variant.price_adjustment || 0),
    0
  );
  const basePrice = effectiveDiscountedPrice || product.price;
  const finalPrice = basePrice + variantPriceAdjustment;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => (navigation as any).navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Carousel */}
        {product.images && product.images.length > 0 && (
          <View style={styles.imageSection}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setImageViewVisible(true)}
            >
              <Image
                source={{
                  uri: product.images[selectedImage]?.url || 'https://via.placeholder.com/400',
                }}
                style={styles.mainImage}
                resizeMode="cover"
              />

              {/* Zoom Icon Indicator */}
              <View style={styles.zoomIndicator}>
                <Ionicons name="expand-outline" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-{discountPercentage}% OFF</Text>
              </View>
            )}

            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockBadgeText}>
                  Only {product.stock_quantity} left!
                </Text>
              </View>
            )}

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailContainer}
              >
                {product.images.map((img, index) => (
                  <TouchableOpacity
                    key={img.id}
                    onPress={() => setSelectedImage(index)}
                    style={[
                      styles.thumbnail,
                      selectedImage === index && styles.thumbnailSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          {product.category && (
            <Text style={styles.category}>{getCategoryIcon(product.category.name)} {product.category.name}</Text>
          )}

          <Text style={styles.productName}>{product.name}</Text>

          {product.brand && (
            <Text style={styles.brand}>Brand: {product.brand}</Text>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(finalPrice)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.price)}
              </Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            {product.stock_quantity > 0 ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.inStockText}>In Stock ({product.stock_quantity})</Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </>
            )}
          </View>

          {/* Product Variants */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantsSection}>
              {/* Color variants */}
              {product.variants.some(v => v.type === 'color') && (
                <VariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariants['color'] || null}
                  onSelectVariant={handleSelectVariant}
                  type="color"
                />
              )}

              {/* Size variants */}
              {product.variants.some(v => v.type === 'size') && (
                <VariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariants['size'] || null}
                  onSelectVariant={handleSelectVariant}
                  type="size"
                />
              )}

              {/* Style variants */}
              {product.variants.some(v => v.type === 'style') && (
                <VariantSelector
                  variants={product.variants}
                  selectedVariant={selectedVariants['style'] || null}
                  onSelectVariant={handleSelectVariant}
                  type="style"
                />
              )}
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Additional Info */}
          {(product.material || product.care_instructions) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Details</Text>
              {product.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Material:</Text>
                  <Text style={styles.detailValue}>{product.material}</Text>
                </View>
              )}
              {product.care_instructions && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Care:</Text>
                  <Text style={styles.detailValue}>{product.care_instructions}</Text>
                </View>
              )}
            </View>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Customer Reviews */}
          <ProductReviewsSection productId={product.id} />

          {/* Similar Products / You May Also Like */}
          {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.similarTitle}>You May Also Like</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarProductsList}
              >
                {similarProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.similarProductCard}
                    onPress={() => {
                      // Navigate to the new product
                      navigation.navigate('ProductDetails', { productId: item.id });
                    }}
                  >
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0].url }}
                        style={styles.similarProductImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.similarProductImagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color={COLORS.textSecondary} />
                      </View>
                    )}

                    <View style={styles.similarProductInfo}>
                      <Text style={styles.similarProductName} numberOfLines={2}>
                        {item.name}
                      </Text>

                      <View style={styles.similarProductPricing}>
                        {item.discounted_price ? (
                          <>
                            <Text style={styles.similarProductDiscountedPrice}>
                              {formatCurrency(item.discounted_price)}
                            </Text>
                            <Text style={styles.similarProductOriginalPrice}>
                              {formatCurrency(item.price)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.similarProductPrice}>
                            {formatCurrency(item.price)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        {product.stock_quantity === 0 ? (
          /* Notify Me Button when out of stock */
          <TouchableOpacity
            style={[
              styles.notifyButton,
              hasStockAlert && styles.notifyButtonActive,
            ]}
            onPress={handleNotifyMe}
            disabled={settingAlert}
          >
            {settingAlert ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={hasStockAlert ? "notifications" : "notifications-outline"}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.notifyButtonText}>
                  {hasStockAlert ? 'Alert Set' : 'Notify Me'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            {/* Add to Cart Button */}
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                justAdded && styles.addToCartButtonSuccess,
              ]}
              onPress={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator color={COLORS.white} />
              ) : justAdded ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.addToCartButtonText}>Added!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cart" size={20} color={COLORS.white} />
                  <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Buy Now Button */}
            <TouchableOpacity
              style={styles.buyNowButton}
              onPress={handleBuyNow}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buyNowButtonText}>Buy Now</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Quantity Modal */}
      <Modal
        isVisible={showQuantityModal}
        onBackdropPress={() => setShowQuantityModal(false)}
        onBackButtonPress={() => setShowQuantityModal(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Quantity</Text>
            <TouchableOpacity onPress={() => setShowQuantityModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          {product && (
            <View style={styles.modalProductInfo}>
              {product.images && product.images.length > 0 && (
                <Image
                  source={{ uri: product.images[0].url }}
                  style={styles.modalProductImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.modalProductDetails}>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.modalProductPrice}>
                  {formatCurrency(effectiveDiscountedPrice || product.price)}
                </Text>
                <Text style={styles.modalProductStock}>
                  {product.stock_quantity} available
                </Text>
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.modalQuantityContainer}>
            <TouchableOpacity
              style={styles.modalQuantityButton}
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={24}
                color={quantity <= 1 ? COLORS.textSecondary : COLORS.primary}
              />
            </TouchableOpacity>
            <Text style={styles.modalQuantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.modalQuantityButton}
              onPress={increaseQuantity}
              disabled={product ? quantity >= product.stock_quantity : true}
            >
              <Ionicons
                name="add"
                size={24}
                color={product && quantity >= product.stock_quantity ? COLORS.textSecondary : COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.modalConfirmButton}
            onPress={modalAction === 'add' ? confirmAddToCart : confirmBuyNow}
          >
            <Text style={styles.modalConfirmButtonText}>
              {modalAction === 'add' ? 'Add to Cart' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Image Zoom Viewer */}
      <ImageView
        images={imageViewImages}
        imageIndex={selectedImage}
        visible={imageViewVisible}
        onRequestClose={() => setImageViewVisible(false)}
        onImageIndexChange={setSelectedImage}
        presentationStyle="overFullScreen"
        animationType="fade"
      />
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
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Just enough space for action bar
  },
  imageSection: {
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: width,
    backgroundColor: COLORS.surface,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  discountBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(243, 156, 18, 0.9)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  lowStockBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },
  category: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  productName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    width: '100%',
    lineHeight: 32,
  },
  brand: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    width: '100%',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  price: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  inStockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  outOfStockText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  variantsSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginHorizontal: SPACING.md,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg + 4,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    shadowOpacity: 0.1,
  },
  addToCartButtonSuccess: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  addToCartButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary, // Same color as Add to Cart button
    paddingVertical: SPACING.lg + 4,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buyNowButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  notifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning || '#f39c12',
    paddingVertical: SPACING.lg + 4,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
    shadowColor: COLORS.warning || '#f39c12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  notifyButtonActive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  notifyButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  backButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  // Modal Styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl + 8,
    borderTopRightRadius: BORDER_RADIUS.xl + 8,
    padding: SPACING.xl,
    paddingBottom: SPACING.xl + 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalProductInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  modalProductImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  modalProductDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  modalProductName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  modalProductPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  modalProductStock: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  modalQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  modalQuantityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalQuantityText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg + 4,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  // Similar Products Section
  similarSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  similarTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  similarProductsList: {
    paddingRight: SPACING.lg,
  },
  similarProductCard: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  similarProductImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  similarProductImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  similarProductInfo: {
    padding: SPACING.sm,
  },
  similarProductName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    minHeight: 32,
  },
  similarProductPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  similarProductPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  similarProductDiscountedPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  similarProductOriginalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
});

export default ProductDetailsScreen;
