import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Fuse from "fuse.js";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/theme";
import ProductCard from "../../components/ProductCard";
import LoadingState from "../../components/LoadingState";
import { getCategoryIcon } from "../../utils";


interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discounted_price?: number;
  stock_quantity: number;
  images: Array<{
    url: string;
    is_primary: boolean;
  }>;
  category?: {
    name: string;
  };
}

interface SearchScreenProps {
  navigation: any;
  route?: {
    params?: {
      query?: string;
      categoryId?: string;
    };
  };
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { history, saveSearch, removeSearch, clearHistory } = useSearchHistory();
  const { recentProducts } = useRecentlyViewed();
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route?.params?.categoryId || null
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "">("" as any);
  const [refreshKey, setRefreshKey] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 0 || selectedCategory) {
        searchProducts();
      } else {
        setProducts([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, sortBy]);

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.query) {
        setSearchQuery(route.params.query);
      }
      if (route?.params?.categoryId) {
        setSelectedCategory(route.params.categoryId);
      }
      setRefreshKey(prev => prev + 1);
    }, [route?.params])
  );

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), searchProducts()]);
    setRefreshing(false);
  }, [searchQuery, selectedCategory, sortBy]);

  // Fuzzy search using Fuse.js
  const fuse = useMemo(() => {
    if (allProducts.length === 0) return null;
    return new Fuse(allProducts, {
      keys: ['name', 'description', 'brand'],
      threshold: 0.1, // 0 = exact match, 1 = match anything (0.1 = 90% similarity required)
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [allProducts]);

  const searchProducts = async () => {
    try {
      setLoading(true);

      // Load all products for fuzzy search
      let query = supabase
        .from("products")
        .select(
          `
          *,
          images:product_images(url, is_primary),
          category:categories(name)
        `
        )
        .eq("is_active", true);

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      setAllProducts(data || []);

      // Apply search if query exists (name and category)
      let results = data || [];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        results = (data || []).filter((product: Product) =>
          product.name.toLowerCase().includes(query) ||
          product.category?.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        );
      }

      // Apply filters
      results = results.filter((product: Product) => {
        const price = product.discounted_price || product.price;
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
        const matchesStock = !showInStockOnly || product.stock_quantity > 0;
        return matchesPrice && matchesStock;
      });

      // Apply sorting
      results = [...results].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "price_low":
            return (a.discounted_price || a.price) - (b.discounted_price || b.price);
          case "price_high":
            return (b.discounted_price || b.price) - (a.discounted_price || a.price);
          default:
            return 0;
        }
      });

      setProducts(results);

      // Save search to history if query is not empty
      if (searchQuery.trim()) {
        await saveSearch(searchQuery);
      }
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setProducts([]);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetails", { productId: product.id });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={!route?.params?.query}
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="options-outline" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {/* Show recent searches if no search query */}
        {!searchQuery && history.length > 0 ? (
          <>
            {history.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryChip}
                onPress={() => setSearchQuery(item)}
              >
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={{marginRight: 4}} />
                <Text style={styles.categoryChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {getCategoryIcon(category.name)} {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "newest" && styles.sortButtonActive]}
          onPress={() => setSortBy("newest")}
        >
          <Text style={[styles.sortButtonText, sortBy === "newest" && styles.sortButtonTextActive]}>
            Newest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "price_low" && styles.sortButtonActive]}
          onPress={() => setSortBy("price_low")}
        >
          <Text style={[styles.sortButtonText, sortBy === "price_low" && styles.sortButtonTextActive]}>
            Price: Low
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "price_high" && styles.sortButtonActive]}
          onPress={() => setSortBy("price_high")}
        >
          <Text style={[styles.sortButtonText, sortBy === "price_high" && styles.sortButtonTextActive]}>
            Price: High
          </Text>
        </TouchableOpacity>
      </View>

      {(searchQuery || selectedCategory || showInStockOnly || priceRange[0] > 0 || priceRange[1] < 100000) && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </Text>
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setSelectedCategory(null);
            setShowInStockOnly(false);
            setPriceRange([0, 100000]);
          }}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );


  const renderRecentlyViewed = () => {
    if (searchQuery.length > 0 || recentProducts.length === 0) return null;

    const rows = [];
    const products = recentProducts.slice(0, 4);

    for (let i = 0; i < products.length; i += 2) {
      rows.push(
        <View key={i} style={styles.recentProductRow}>
          <View style={styles.productContainer}>
            <ProductCard
              product={products[i]}
              onPress={() => navigation.navigate('ProductDetails', { productId: products[i].id })}
            />
          </View>
          {products[i + 1] ? (
            <View style={styles.productContainer}>
              <ProductCard
                product={products[i + 1]}
                onPress={() => navigation.navigate('ProductDetails', { productId: products[i + 1].id })}
              />
            </View>
          ) : (
            <View style={styles.productContainer} />
          )}
        </View>
      );
    }

    return (
      <View style={styles.recentlyViewedContainer}>
        <Text style={styles.sectionTitle}>Recently Viewed</Text>
        {rows}
      </View>
    );
  };

  const renderFiltersPanel = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersOverlay}>
        <TouchableOpacity
          style={styles.filtersBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <SafeAreaView style={styles.filtersPanel} edges={['top', 'bottom']}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Price Range: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
              </Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  value={priceRange[0].toString()}
                  onChangeText={(text) => setPriceRange([parseInt(text) || 0, priceRange[1]])}
                  keyboardType="numeric"
                  placeholder="Min"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  value={priceRange[1].toString()}
                  onChangeText={(text) => setPriceRange([priceRange[0], parseInt(text) || 100000])}
                  keyboardType="numeric"
                  placeholder="Max"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Stock Filter */}
            <TouchableOpacity
              style={styles.filterCheckbox}
              onPress={() => setShowInStockOnly(!showInStockOnly)}
            >
              <Ionicons
                name={showInStockOnly ? "checkbox" : "square-outline"}
                size={24}
                color={showInStockOnly ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={styles.filterCheckboxLabel}>In Stock Only</Text>
            </TouchableOpacity>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={() => {
                setShowFilters(false);
                searchProducts();
              }}
            >
              <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery.length === 0 && !selectedCategory ? (
        <>
          <Ionicons name="search-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Search for products</Text>
          <Text style={styles.emptySubtitle}>
            Enter a product name, brand, or description
          </Text>
          {renderRecentlyViewed()}
        </>
      ) : (
        <>
          <Ionicons name="search-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderFilters()}
      {renderFiltersPanel()}

      {loading ? (
        <LoadingState loading={true} emptyMessage="Searching...">
          {null}
        </LoadingState>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <View style={styles.productContainer}>
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
                userId={user?.id}
                refreshKey={refreshKey}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.emptyStateScroll}>
          {renderEmptyState()}
        </ScrollView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    height: 48,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesScroll: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sortButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "500",
  },
  sortButtonTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  resultsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
  },
  clearFiltersText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  productsGrid: {
    padding: SPACING.lg,
  },
  row: {
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  productContainer: {
    flex: 1,
    maxWidth: '48%',
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
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
    lineHeight: 24,
  },
  emptyStateScroll: {
    flexGrow: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  historyContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  historyClear: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  historyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  historyRemove: {
    padding: SPACING.xs,
  },
  recentlyViewedContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  recentProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  filtersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  filtersBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filtersPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
  },
  priceSeparator: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  filterCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  filterCheckboxLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  applyFilterButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  applyFilterButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default SearchScreen;
