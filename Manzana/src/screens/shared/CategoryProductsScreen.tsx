import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Product, Promotion, CategoryProductsScreenProps } from "../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import { formatCurrency, optimizeImageUrl, calculatePromotionPrice } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";
import PromotionBadge from "../../components/PromotionBadge";

// Type for product image
interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

const CategoryProductsScreen: React.FC<CategoryProductsScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { categoryId, categoryName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sortBy, setSortBy] = useState<
    "newest" | "price_asc" | "price_desc" | "name_asc"
  >("newest");

  useEffect(() => {
    loadPromotions();
    loadProducts();
  }, [categoryId, sortBy]);

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      setPromotions((data || []) as Promotion[]);
    } catch (error) {
      console.error("Error loading promotions:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      // First, check if this category has subcategories
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, level")
        .eq("id", categoryId)
        .single();

      if (categoryError) throw categoryError;

      let categoryIds: string[] = [categoryId];

      // If this is a parent category (level 0), also include subcategories
      if (categoryData?.level === 0) {
        const { data: subcategories, error: subcatError } = await supabase
          .from("categories")
          .select("id")
          .eq("parent_category_id", categoryId)
          .eq("is_active", true);

        if (!subcatError && subcategories) {
          categoryIds = [
            categoryId,
            ...subcategories.map((sub) => sub.id),
          ];
        }
      }

      // Query products with category filter
      let query = supabase
        .from("products")
        .select(
          `
          *,
          images:product_images(url, alt_text, is_primary)
        `,
        )
        .in("category_id", categoryIds)
        .eq("is_active", true)
        .gt("stock_quantity", 0);

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort product images to put primary first
      const productsWithSortedImages =
        data?.map((product: any) => ({
          ...product,
          images:
            product.images?.sort(
              (a: ProductImage, b: ProductImage) =>
                (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0),
            ) || [],
        })) || [];

      // Debug logging to check image data
      console.log('🔍 Products loaded:', productsWithSortedImages.length);
      productsWithSortedImages.forEach((product: any, index: number) => {
        if (index < 3) { // Log first 3 products only
          console.log(`📦 Product ${index + 1}:`, {
            name: product.name,
            imageCount: product.images?.length || 0,
            firstImageUrl: product.images?.[0]?.url || 'No image',
            allImages: product.images?.map((img: ProductImage) => ({ url: img.url, isPrimary: img.is_primary }))
          });
        }
      });

      setProducts(productsWithSortedImages);
    } catch (error) {
      console.error("Error loading category products:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {categoryName}
      </Text>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => (navigation as any).navigate("Search", { categoryId })}
      >
        <Ionicons name="search" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <FlatList
        data={[
          { key: "newest", label: "Most recent" },
          { key: "price_asc", label: "Price: low to high" },
          { key: "price_desc", label: "Price: high to low" },
          { key: "name_asc", label: "Name A-Z" },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === item.key && styles.sortButtonActive,
            ]}
            onPress={() => setSortBy(item.key as any)}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortBy === item.key && styles.sortButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortList}
        keyExtractor={(item) => item.key}
      />
    </View>
  );

  const renderProductCard = ({ item }: { item: Product }) => {
    const priceResult = calculatePromotionPrice(item, promotions);
    const hasPromotion = priceResult.appliedPromotion !== null;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          navigation.navigate("ProductDetails", { productId: item.id })
        }
      >
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: optimizeImageUrl(item.images[0].url, 180, 180) }}
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

        {/* Promotion Badge */}
        {hasPromotion && priceResult.appliedPromotion && (
          <View style={styles.promotionBadgeContainer}>
            <PromotionBadge
              promotion={priceResult.appliedPromotion}
              showCountdown={false}
            />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.productPricing}>
            {hasPromotion ? (
              <>
                <Text style={styles.productDiscountedPrice}>
                  {formatCurrency(priceResult.finalPrice)}
                </Text>
                <Text style={styles.productOriginalPrice}>
                  {formatCurrency(priceResult.originalPrice)}
                </Text>
              </>
            ) : item.discounted_price ? (
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

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => {
            // Add to wishlist logic
          }}
        >
          <Ionicons name="heart-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="grid-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No products available</Text>
      <Text style={styles.emptySubtitle}>
        No products found in this category at this time
      </Text>
      <Button
        title="View Other Categories"
        onPress={() => (navigation as any).navigate("Categories")}
        style={styles.exploreButton}
      />
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading products">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSortOptions()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {products.length} {products.length === 1 ? "product" : "products"}
        </Text>
      </View>

      {products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.md,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  sortContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortList: {
    paddingHorizontal: SPACING.lg,
  },
  sortButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.xs,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  resultsCount: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  listContent: {
    padding: SPACING.md,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
    marginBottom: SPACING.sm,
  },
  productImage: {
    width: "100%",
    height: 160,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs / 2,
    minHeight: 32,
  },
  productPricing: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs / 2,
  },
  productPrice: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  productDiscountedPrice: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.xs,
  },
  productOriginalPrice: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  lowStockText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: "600",
  },
  promotionBadgeContainer: {
    position: "absolute",
    top: SPACING.xs,
    left: SPACING.xs,
    zIndex: 1,
  },
  favoriteButton: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
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

export default CategoryProductsScreen;
