import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { useProductsWithPromotions } from "../../../hooks/useProductsWithPromotions";
import {
  Product,
  Category,
  SearchFilters,
  CatalogScreenProps,
} from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  PRODUCT_FILTERS,
} from "../../../constants/theme";
import { debounce, getCategoryIcon } from "../../../utils";
import LoadingState from "../../../components/LoadingState";
import ProductCard from "../../../components/ProductCard";
import Button from "../../../components/Button";

const CatalogScreen: React.FC<CatalogScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const ITEMS_PER_PAGE = 20;

  // Apply active promotions to products
  const { products: productsWithPromotions } = useProductsWithPromotions(products, user?.user_type);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh wishlist states when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => {
    // Apply route params as initial filters
    if (route?.params) {
      const newFilters: SearchFilters = {};

      if ((route.params as any)?.featured) {
        // Filter for featured products will be handled in the query
      }

      if ((route.params as any)?.newest) {
        setSortBy("newest");
      }

      if ((route.params as any)?.categoryId) {
        newFilters.category = (route.params as any).categoryId;
      }

      setFilters(newFilters);
    }
  }, [route?.params]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts(true)]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (reset = false) => {
    try {
      if (reset) {
        setLoadingMore(false);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      let query = supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `,
        )
        .eq("is_active", true);

      // Apply route-based filters
      if ((route?.params as any)?.featured) {
        query = query.eq("is_featured", true);
      }

      // Apply search query (search in name and description)
      if (searchQuery.trim()) {
        // Search in product name OR description
        // Note: category.name requires a separate join query, so excluded here
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      // Apply filters
      if (filters.category) {
        query = query.eq("category_id", filters.category);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.brand) {
        query = query.eq("brand", filters.brand);
      }

      if (filters.inStock) {
        query = query.gt("stock_quantity", 0);
      }

      if (filters.onSale) {
        query = query.not("discounted_price", "is", null);
      }

      // Apply sorting
      switch (sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "popular":
          // For now, use created_at as proxy for popularity
          query = query.order("created_at", { ascending: false });
          break;
        default: // newest
          query = query.order("created_at", { ascending: false });
          break;
      }

      query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Sort images to put primary first
      const productsWithSortedImages =
        data?.map((product) => ({
          ...product,
          images:
            product.images?.sort(
              (a: any, b: any) =>
                (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0),
            ) || [],
        })) || [];

      if (reset) {
        setProducts(productsWithSortedImages);
      } else {
        setProducts((prev) => [...prev, ...productsWithSortedImages]);
      }

      setHasMore(data?.length === ITEMS_PER_PAGE);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 500),
    [],
  );

  // Trigger fetch when searchQuery changes
  useEffect(() => {
    fetchProducts(true);
  }, [searchQuery, filters, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts();
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetails", { productId: product.id });
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchProducts(true);
  };

  const clearFilters = () => {
    setFilters({});
    setSortBy("newest");
    setSearchQuery("");
    setShowFilters(false);
    fetchProducts(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.textSecondary}
            onChangeText={debouncedSearch}
            defaultValue={searchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Active Filters - only show when filters are actually applied */}
      {(Object.keys(filters).length > 0 || searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>
            {products.length} products found
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        showWishlist={true}
        userId={user?.id}
        refreshKey={refreshKey}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search filters
      </Text>
      <Button
        title="Clear filters"
        onPress={clearFilters}
        variant="outline"
        style={styles.clearButton}
      />
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort by</Text>
            {PRODUCT_FILTERS.SORT_BY.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.filterOption}
                onPress={() => setSortBy(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    sortBy === option.value && styles.filterOptionActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Category</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({ ...prev, category: undefined }))
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  !filters.category && styles.filterOptionActive,
                ]}
              >
                All categories
              </Text>
              {!filters.category && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.filterOption}
                onPress={() =>
                  setFilters((prev) => ({ ...prev, category: category.id }))
                }
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.category === category.id &&
                      styles.filterOptionActive,
                  ]}
                >
                  {getCategoryIcon(category.name)} {category.name}
                </Text>
                {filters.category === category.id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Price range</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  minPrice: undefined,
                  maxPrice: undefined,
                }))
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  !filters.minPrice &&
                    !filters.maxPrice &&
                    styles.filterOptionActive,
                ]}
              >
                Any price
              </Text>
              {!filters.minPrice && !filters.maxPrice && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            {PRODUCT_FILTERS.PRICE_RANGES.map((range, index) => (
              <TouchableOpacity
                key={index}
                style={styles.filterOption}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    minPrice: range.min,
                    maxPrice: range.max || undefined,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.minPrice === range.min &&
                      filters.maxPrice === range.max &&
                      styles.filterOptionActive,
                  ]}
                >
                  {range.label}
                </Text>
                {filters.minPrice === range.min &&
                  filters.maxPrice === range.max && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Other Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Other filters</Text>

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  inStock: !filters.inStock,
                }))
              }
            >
              <Text style={styles.filterOptionText}>
                Only products in stock
              </Text>
              <View
                style={[
                  styles.checkbox,
                  filters.inStock && styles.checkboxActive,
                ]}
              >
                {filters.inStock && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  onSale: !filters.onSale,
                }))
              }
            >
              <Text style={styles.filterOptionText}>Only products on sale</Text>
              <View
                style={[
                  styles.checkbox,
                  filters.onSale && styles.checkboxActive,
                ]}
              >
                {filters.onSale && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button title="Apply filters" onPress={applyFilters} fullWidth />
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading product catalog">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={productsWithPromotions}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    height: "100%",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  activeFiltersText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  clearFiltersText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.lg,
  },
  row: {
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  productContainer: {
    flex: 1,
    maxWidth: "48%",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  clearButton: {
    alignSelf: "center",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  clearText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  filterSection: {
    marginVertical: SPACING.lg,
  },
  filterTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  filterOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  filterOptionActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default CatalogScreen;
