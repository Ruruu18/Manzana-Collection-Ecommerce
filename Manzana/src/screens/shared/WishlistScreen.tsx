import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useCartStore } from "../../store/cartStore";
import { Product } from "../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import {
  formatCurrency,
  optimizeImageUrl,
  sortWishlistItemsWithImages,
  toast,
} from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

interface WishlistItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  product: Product;
}

interface WishlistScreenProps {
  navigation: any;
}

const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Use Zustand store for cart
  const { addToCartAsync } = useCartStore();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("wishlist")
        .select(
          `
          *,
          product:products(
            *,
            images:product_images(url, alt_text, is_primary)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Sort product images to put primary first using utility function
      const itemsWithSortedImages = sortWishlistItemsWithImages(
        data || [],
      ) as WishlistItem[];

      setWishlistItems(itemsWithSortedImages);
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlist();
    setRefreshing(false);
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      const removedItem = wishlistItems.find(item => item.id === itemId);
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.removedFromWishlist(removedItem?.product?.name);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Could not remove product from wishlist");
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      toast.warning("Login Required", "Please sign in to add items to cart");
      return;
    }

    try {
      // Use Zustand store with optimistic update
      const { error } = await addToCartAsync(user.id, product.id, 1);

      if (error) {
        toast.error("Could not add product to cart");
        console.error("Add to cart error:", error);
        return;
      }

      toast.addedToCart(product.name);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Wishlist</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.wishlistCard}>
      <TouchableOpacity
        style={styles.productInfo}
        onPress={() =>
          navigation.navigate("ProductDetails", { productId: item.product.id })
        }
      >
        {item.product.images && item.product.images.length > 0 ? (
          <Image
            source={{
              uri: optimizeImageUrl(item.product.images[0].url, 100, 100),
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

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>

          <View style={styles.productPricing}>
            {item.product.discounted_price ? (
              <>
                <Text style={styles.productDiscountedPrice}>
                  {formatCurrency(item.product.discounted_price)}
                </Text>
                <Text style={styles.productOriginalPrice}>
                  {formatCurrency(item.product.price)}
                </Text>
              </>
            ) : (
              <Text style={styles.productPrice}>
                {formatCurrency(item.product.price)}
              </Text>
            )}
          </View>

          <Text style={styles.stockStatus}>
            {item.product.stock_quantity > 0
              ? `${item.product.stock_quantity} available`
              : "Out of stock"}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromWishlist(item.id)}
        >
          <Ionicons name="heart" size={24} color={COLORS.error} />
        </TouchableOpacity>

        <Button
          title={
            item.product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"
          }
          onPress={() => addToCart(item.product)}
          disabled={item.product.stock_quantity === 0}
          size="small"
          style={styles.addToCartButton}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add products you like to find them easily later
      </Text>
      <Button
        title="Explore Products"
        onPress={() => navigation.navigate("Catalog")}
        style={styles.exploreButton}
      />
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading wishlist">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {wishlistItems.length > 0 ? (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  itemCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.lg,
  },
  wishlistCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flexDirection: "row",
    marginBottom: SPACING.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "space-between",
  },
  productName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
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
  stockStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartButton: {
    flex: 1,
    marginLeft: SPACING.md,
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

export default WishlistScreen;
