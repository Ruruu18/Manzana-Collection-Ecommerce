import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { useProductImagesPreloader } from "../../../hooks/useImagePreloader";
import { useCartStore } from "../../../store/cartStore";
import { useFeaturedProducts, useNewProducts } from "../../../hooks/useProductQueries";
import { useFeaturedPromotions, useCategories } from "../../../hooks/usePromotionQueries";
import { useProductsWithPromotions } from "../../../hooks/useProductsWithPromotions";
import { Product, Category, Promotion, HomeScreenProps } from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../../constants/theme";
import { formatCurrency, getCategoryIcon } from "../../../utils";
import LoadingState from "../../../components/LoadingState";
import ProductCard from "../../../components/ProductCard";
import Button from "../../../components/Button";
import PromotionCountdown from "../../../components/PromotionCountdown";
import OptimizedImage from "../../../components/OptimizedImage";

const { width: screenWidth } = Dimensions.get("window");
const PROMOTION_CARD_WIDTH = screenWidth - SPACING.lg * 2;
const CATEGORY_CARD_WIDTH = 120;
const PRODUCT_CARD_WIDTH = 160;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Use Zustand store for cart count
  const { cartCount, loadCart } = useCartStore();

  // Use React Query for cached data fetching
  const {
    data: featuredPromotions = [],
    isLoading: promotionsLoading,
    refetch: refetchPromotions,
  } = useFeaturedPromotions(user?.user_type);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const {
    data: rawFeaturedProducts = [],
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedProducts();

  const {
    data: rawNewProducts = [],
    isLoading: newProductsLoading,
    refetch: refetchNew,
  } = useNewProducts();

  // Apply active promotions to products
  const { products: featuredProducts, isLoading: featuredPromosLoading } = useProductsWithPromotions(
    rawFeaturedProducts,
    user?.user_type
  );

  const { products: newProducts, isLoading: newPromosLoading } = useProductsWithPromotions(
    rawNewProducts,
    user?.user_type
  );

  // Combined loading state
  const loading = promotionsLoading || categoriesLoading || featuredLoading || newProductsLoading || featuredPromosLoading || newPromosLoading;
  const [refreshing, setRefreshing] = useState(false);

  // Preload featured product images
  useProductImagesPreloader(featuredProducts, {
    width: PRODUCT_CARD_WIDTH,
    height: PRODUCT_CARD_WIDTH,
    quality: 85,
    enabled: featuredProducts.length > 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadCart(user.id);
    }
  }, [user?.id]);

  // Refresh cart when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadCart(user.id);
      }
    }, [user?.id])
  );

  // Refetch all data on pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPromotions(),
      refetchCategories(),
      refetchFeatured(),
      refetchNew(),
    ]);
    setRefreshing(false);
  }, [refetchPromotions, refetchCategories, refetchFeatured, refetchNew]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.userName}>{user?.full_name || "Welcome"}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate("Search")}
          >
            <Ionicons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => (navigation as any).navigate("Cart")}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? "99+" : String(cartCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={COLORS.text}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {user?.user_type === "reseller" && (
        <View style={styles.resellerBanner}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.primary]}
            style={styles.resellerGradient}
          >
            <Ionicons name="business-outline" size={20} color={COLORS.white} />
            <Text style={styles.resellerText}>
              Access special wholesale prices
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  const renderPromotionCard = ({ item }: { item: Promotion & { isActive?: boolean } }) => {
    const now = new Date();
    const startDate = new Date(item.start_date);
    const isUpcoming = startDate > now;

    // For upcoming promotions, use the PromotionCountdown component
    if (isUpcoming) {
      return (
        <PromotionCountdown
          promotion={item}
          onPress={(promotion) =>
            (navigation as any).navigate("PromotionDetails", {
              promotionId: promotion.id,
            })
          }
        />
      );
    }

    // For active promotions, use cleaner card design
    return (
      <View style={styles.activePromotionContainer}>
        <TouchableOpacity
          style={styles.promotionCard}
          onPress={() =>
            (navigation as any).navigate("PromotionDetails", {
              promotionId: item.id,
            })
          }
          activeOpacity={0.9}
        >
          {/* Image with overlay */}
          <View style={styles.promotionImageContainer}>
            {item.image_url ? (
              <OptimizedImage
                uri={item.image_url}
                width={PROMOTION_CARD_WIDTH}
                height={160}
                contentFit="cover"
                style={styles.promotionImage}
                priority="high"
              />
            ) : (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.promotionImagePlaceholder}
              >
                <Ionicons name="pricetag" size={40} color={COLORS.white} />
              </LinearGradient>
            )}

            {/* Dark overlay for better text readability */}
            <View style={styles.promotionOverlay} />

            {/* Content on image */}
            <View style={styles.promotionImageContent}>
              {/* Top badges */}
              <View style={styles.topBadgesRow}>
                <View style={styles.activePromotionBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.activePromotionText}>LIVE NOW</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.promotionTitleOnImage} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Bottom row with discount */}
              <View style={styles.promotionBadge}>
                <Text style={styles.promotionBadgeText}>
                  {item.promotion_type === "percentage"
                    ? `${String(item.discount_value || 0)}% OFF`
                    : item.promotion_type === "fixed_amount"
                      ? `₱${String(item.discount_value || 0)} OFF`
                      : item.promotion_type === "free_shipping"
                        ? "FREE SHIPPING"
                        : "SPECIAL OFFER"}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* View Promotion Button - Outside */}
        <TouchableOpacity
          style={styles.activePromotionButton}
          onPress={() =>
            (navigation as any).navigate("PromotionDetails", {
              promotionId: item.id,
            })
          }
        >
          <Text style={styles.activePromotionButtonText}>View Promotion</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() =>
        navigation.navigate("CategoryProducts", {
          categoryId: item.id,
          categoryName: item.name,
        })
      }
    >
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryIcon}>{getCategoryIcon(item.name)}</Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        navigation.navigate("ProductDetails", { productId: item.id })
      }
    >
      {item.images && item.images.length > 0 ? (
        <OptimizedImage
          uri={item.images[0].url}
          width={PRODUCT_CARD_WIDTH}
          height={PRODUCT_CARD_WIDTH}
          contentFit="cover"
          style={styles.productImage}
          priority="low"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons
            name="image-outline"
            size={32}
            color={COLORS.textSecondary}
          />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.productPricing}>
          {item.discounted_price ? (
            <>
              <Text style={styles.productDiscountedPrice}>
                {formatCurrency(item.discounted_price)}
              </Text>
              <Text style={styles.productOriginalPrice}>
                {formatCurrency(item.price)}
              </Text>
            </>
          ) : (
            <Text style={styles.productPrice}>
              {formatCurrency(item.price)}
            </Text>
          )}
        </View>

        {item.stock_quantity <= 5 && (
          <Text style={styles.lowStockText}>
            Only {String(item.stock_quantity)} available!
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    data: any[],
    renderItem: any,
    onSeeAll?: () => void,
    horizontal = true,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.horizontalList : undefined}
        ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading home content">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}

        {/* Featured Promotions */}
        {featuredPromotions.length > 0 &&
          renderSection("Promotions", featuredPromotions, renderPromotionCard, () =>
            (navigation as any).navigate("Promotions"),
          )}

        {/* Categories */}
        {categories.length > 0 &&
          renderSection("Categories", categories, renderCategoryCard, () =>
            navigation.navigate("Categories"),
          )}

        {/* Featured Products */}
        {featuredProducts.length > 0 &&
          renderSection(
            "Featured Products",
            featuredProducts,
            renderProductCard,
            () => (navigation as any).navigate("Catalog", { featured: true }),
          )}

        {/* New Products */}
        {newProducts.length > 0 &&
          renderSection("New Arrivals", newProducts, renderProductCard, () =>
            (navigation as any).navigate("Catalog", { newest: true }),
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  resellerBanner: {
    marginTop: SPACING.sm,
  },
  resellerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  resellerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  promotionsContainer: {
    marginVertical: SPACING.lg,
  },
  promotionsList: {
    paddingHorizontal: SPACING.lg,
  },
  activePromotionContainer: {
    width: PROMOTION_CARD_WIDTH,
    marginRight: SPACING.md,
    marginVertical: SPACING.md,
  },
  promotionCard: {
    width: PROMOTION_CARD_WIDTH,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: SPACING.sm,
  },
  promotionImageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  promotionImage: {
    width: "100%",
    height: "100%",
  },
  promotionImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  promotionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  promotionImageContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.md,
    justifyContent: "space-between",
  },
  topBadgesRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  promotionBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  promotionBadgeText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  activePromotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  activePromotionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  promotionTitleOnImage: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  activePromotionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activePromotionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  seeAllText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
  },
  horizontalList: {
    paddingHorizontal: SPACING.lg,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    alignItems: "center",
  },
  categoryIconContainer: {
    width: CATEGORY_CARD_WIDTH - SPACING.md,
    height: CATEGORY_CARD_WIDTH - SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  categoryIcon: {
    fontSize: 48,
  },
  categoryName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "600",
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: PRODUCT_CARD_WIDTH,
  },
  productImagePlaceholder: {
    width: "100%",
    height: PRODUCT_CARD_WIDTH,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    minHeight: 32,
  },
  productPricing: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  productPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  productDiscountedPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.sm,
  },
  productOriginalPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  lowStockText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontWeight: "600",
  },
});

export default HomeScreen;
