import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProductCardProps } from "../types";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../constants/theme";
import {
  formatCurrency,
  calculateDiscountPercentage,
} from "../utils";
import { supabase } from "../services/supabase";
import OptimizedImage from "./OptimizedImage";

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showWishlist = true,
  userId,
  refreshKey = 0,
}) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasDiscount =
    product.discounted_price && product.discounted_price < product.price;
  const discountPercentage = hasDiscount
    ? calculateDiscountPercentage(product.price, product.discounted_price!)
    : 0;

  useEffect(() => {
    if (userId && product.id) {
      checkWishlistStatus();
    }
  }, [userId, product.id, refreshKey]);

  const checkWishlistStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking wishlist:", error);
      }

      setIsInWishlist(!!data);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handlePress = () => {
    onPress(product);
  };

  const handleWishlistPress = async (e: any) => {
    e.stopPropagation();

    if (!userId) {
      Alert.alert("Sign In Required", "Please sign in to add items to your wishlist.");
      return;
    }

    if (isLoadingWishlist) return;

    setIsLoadingWishlist(true);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);

        if (error) throw error;

        setIsInWishlist(false);
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from("wishlist")
          .insert({
            user_id: userId,
            product_id: product.id,
          });

        if (error) throw error;

        setIsInWishlist(true);
        Alert.alert("Added to Wishlist", `${product.name} has been added to your wishlist.`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      Alert.alert("Error", "Failed to update wishlist. Please try again.");
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const finalPrice = hasDiscount ? product.discounted_price! : product.price;
  const accessibilityLabel = `${product.name}, ${formatCurrency(finalPrice)}${hasDiscount ? `, ${discountPercentage}% off` : ''}${product.stock_quantity === 0 ? ', out of stock' : ''}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view product details"
      accessibilityRole="button"
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {primaryImage ? (
          <OptimizedImage
            uri={primaryImage.url}
            width={200}
            height={200}
            contentFit="cover"
            style={styles.image}
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            style={styles.imagePlaceholder}
            accessibilityLabel="No product image available"
            accessibilityRole="image"
          >
            <Ionicons
              name="image-outline"
              size={40}
              color={COLORS.textSecondary}
            />
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{String(discountPercentage)}%</Text>
          </View>
        )}

        {/* Action Buttons */}
        {showWishlist && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isInWishlist && styles.wishlistButtonActive,
              ]}
              onPress={handleWishlistPress}
              disabled={isLoadingWishlist}
              accessibilityLabel={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              accessibilityHint={
                isInWishlist
                  ? "Double tap to remove this item from your wishlist"
                  : "Double tap to add this item to your wishlist"
              }
              accessibilityRole="button"
            >
              <Ionicons
                name={isInWishlist ? "heart" : "heart-outline"}
                size={18}
                color={isInWishlist ? COLORS.white : COLORS.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Low Stock Indicator */}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <View style={styles.lowStockIndicator}>
            <Text style={styles.lowStockText}>
              Only {String(product.stock_quantity)} available!
            </Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {product.stock_quantity === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {/* Category */}
        {product.category && (
          <Text style={styles.categoryText} numberOfLines={1}>
            {product.category.name}
          </Text>
        )}

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Brand */}
        {product.brand && (
          <Text style={styles.brandText} numberOfLines={1}>
            {product.brand}
          </Text>
        )}

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          {hasDiscount ? (
            <>
              <Text style={styles.discountedPrice}>
                {formatCurrency(product.discounted_price!)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatCurrency(product.price)}
              </Text>
            </>
          ) : (
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          )}
        </View>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {product.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stock Status */}
        <View style={styles.stockStatus}>
          {product.stock_quantity > 0 ? (
            <View style={styles.inStockIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={COLORS.success}
              />
              <Text style={styles.inStockText}>In stock</Text>
            </View>
          ) : (
            <View style={styles.outOfStockIndicator}>
              <Ionicons name="close-circle" size={12} color={COLORS.error} />
              <Text style={styles.outOfStockStatusText}>Out of Stock</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: SPACING.md,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  discountBadge: {
    position: "absolute",
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "bold",
  },
  actionButtons: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "column",
    gap: SPACING.xs,
  },
  actionButton: {
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
  actionButtonActive: {
    backgroundColor: COLORS.warning,
  },
  wishlistButtonActive: {
    backgroundColor: COLORS.error,
  },
  lowStockIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(243, 156, 18, 0.9)",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  lowStockText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "600",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    fontWeight: "bold",
  },
  productInfo: {
    padding: SPACING.md,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  productName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    height: 40, // Fixed height for consistent card alignment
  },
  brandText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: SPACING.sm,
  },
  pricingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  price: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  discountedPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.sm,
  },
  originalPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  stockStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  inStockIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  inStockText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: "600",
  },
  outOfStockIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  outOfStockStatusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontWeight: "600",
  },
});

export default ProductCard;
