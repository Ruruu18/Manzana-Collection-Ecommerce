import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { Product, Category, Promotion, HomeScreenProps } from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../../constants/theme";
import {
  formatCurrency,
  optimizeImageUrl,
  sortProductsWithImages,
} from "../../../utils";
import LoadingState from "../../../components/LoadingState";
import ProductCard from "../../../components/ProductCard";
import Button from "../../../components/Button";

const { width: screenWidth } = Dimensions.get("window");
const PROMOTION_CARD_WIDTH = screenWidth - SPACING.lg * 2;
const CATEGORY_CARD_WIDTH = 120;
const PRODUCT_CARD_WIDTH = 160;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredPromotions, setFeaturedPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchFeaturedPromotions(),
        fetchCategories(),
        fetchFeaturedProducts(),
        fetchNewProducts(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const fetchFeaturedPromotions = async () => {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .lte("start_date", now)
        .gte("end_date", now)
        .order("created_at", { ascending: false })
        .limit(5);

      // Filter by user type if user is logged in
      if (user?.user_type) {
        query = query.or(
          `user_type_restriction.is.null,user_type_restriction.eq.${user.user_type}`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeaturedPromotions(data || []);
    } catch (error) {
      console.error("Error fetching featured promotions:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `,
        )
        .eq("is_active", true)
        .eq("is_featured", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Sort images to put primary first using utility function
      const productsWithSortedImages = sortProductsWithImages(
        data || [],
      ) as Product[];

      setFeaturedProducts(productsWithSortedImages);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  const fetchNewProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `,
        )
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Sort images to put primary first using utility function
      const productsWithSortedImages = sortProductsWithImages(
        data || [],
      ) as Product[];

      setNewProducts(productsWithSortedImages);
    } catch (error) {
      console.error("Error fetching new products:", error);
    }
  };

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
                  {unreadCount > 99 ? "99+" : unreadCount}
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

  const renderPromotionCard = ({ item }: { item: Promotion }) => (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={() =>
        (navigation as any).navigate("PromotionDetails", {
          promotionId: item.id,
        })
      }
    >
      {item.image_url ? (
        <Image
          source={{
            uri: optimizeImageUrl(item.image_url, PROMOTION_CARD_WIDTH, 200),
          }}
          style={styles.promotionImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.promotionImagePlaceholder}
        >
          <Ionicons name="pricetag" size={40} color={COLORS.white} />
        </LinearGradient>
      )}

      <View style={styles.promotionContent}>
        <View style={styles.promotionBadge}>
          <Text style={styles.promotionBadgeText}>
            {item.promotion_type === "percentage"
              ? `${item.discount_value}% OFF`
              : item.promotion_type === "fixed_amount"
                ? `$${item.discount_value} OFF`
                : item.promotion_type === "free_shipping"
                  ? "FREE SHIPPING"
                  : "SPECIAL OFFER"}
          </Text>
        </View>

        <Text style={styles.promotionTitle}>{item.title}</Text>
        <Text style={styles.promotionDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <Button
          title="View Promotion"
          onPress={() =>
            (navigation as any).navigate("PromotionDetails", {
              promotionId: item.id,
            })
          }
          size="small"
          style={styles.promotionButton}
        />
      </View>
    </TouchableOpacity>
  );

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
      {item.image_url ? (
        <Image
          source={{
            uri: optimizeImageUrl(
              item.image_url,
              CATEGORY_CARD_WIDTH,
              CATEGORY_CARD_WIDTH,
            ),
          }}
          style={styles.categoryImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.categoryImagePlaceholder}>
          <Ionicons name="grid-outline" size={32} color={COLORS.primary} />
        </View>
      )}
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
        <Image
          source={{
            uri: optimizeImageUrl(
              item.images[0].url,
              PRODUCT_CARD_WIDTH,
              PRODUCT_CARD_WIDTH,
            ),
          }}
          style={styles.productImage}
          resizeMode="cover"
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
            Only {item.stock_quantity} available!
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
        {featuredPromotions.length > 0 && (
          <FlatList
            data={featuredPromotions}
            renderItem={renderPromotionCard}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promotionsList}
            snapToInterval={PROMOTION_CARD_WIDTH + SPACING.md}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            style={styles.promotionsContainer}
          />
        )}

        {/* Categories */}
        {categories.length > 0 &&
          renderSection("Categories", categories, renderCategoryCard, () =>
            navigation.navigate("Catalog"),
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
  promotionCard: {
    width: PROMOTION_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    marginRight: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  promotionImage: {
    width: "100%",
    height: 200,
  },
  promotionImagePlaceholder: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  promotionContent: {
    padding: SPACING.md,
  },
  promotionBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  promotionBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "bold",
  },
  promotionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  promotionDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  promotionButton: {
    alignSelf: "flex-start",
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
  categoryImage: {
    width: CATEGORY_CARD_WIDTH - SPACING.md,
    height: CATEGORY_CARD_WIDTH - SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  categoryImagePlaceholder: {
    width: CATEGORY_CARD_WIDTH - SPACING.md,
    height: CATEGORY_CARD_WIDTH - SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
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
