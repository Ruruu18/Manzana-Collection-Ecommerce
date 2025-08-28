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
import { Product, CategoryProductsScreenProps } from "../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import { formatCurrency, optimizeImageUrl } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

const CategoryProductsScreen: React.FC<CategoryProductsScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { categoryId, categoryName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<
    "newest" | "price_asc" | "price_desc" | "name_asc"
  >("newest");

  useEffect(() => {
    loadProducts();
  }, [categoryId, sortBy]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select(
          `
          *,
          images:product_images(url, alt_text, is_primary)
        `,
        )
        .eq("category_id", categoryId)
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
        data?.map((product) => ({
          ...product,
          images:
            product.images?.sort(
              (a: any, b: any) =>
                (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0),
            ) || [],
        })) || [];

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

  const renderProductCard = ({ item }: { item: Product }) => (
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="grid-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No products available</Text>
      <Text style={styles.emptySubtitle}>
        No products found in this category at this time
      </Text>
      <Button
        title="View Other Categories"
        onPress={() => (navigation as any).navigate("Catalog")}
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortList: {
    paddingHorizontal: SPACING.lg,
  },
  sortButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  resultsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  resultsCount: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.lg,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 180,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 180,
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
  favoriteButton: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
