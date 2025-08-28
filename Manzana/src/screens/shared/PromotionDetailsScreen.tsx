import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Promotion, Product } from "../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import { formatCurrency, optimizeImageUrl, formatDate } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

const { width: screenWidth } = Dimensions.get("window");

interface PromotionDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      promotionId: string;
    };
  };
}

const PromotionDetailsScreen: React.FC<PromotionDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { promotionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [applicableProducts, setApplicableProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadPromotionDetails();
  }, [promotionId]);

  const loadPromotionDetails = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPromotionDetails(), fetchApplicableProducts()]);
    } catch (error) {
      console.error("Error loading promotion details:", error);
      Alert.alert("Error", "Could not load promotion information");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("id", promotionId)
        .single();

      if (error) throw error;
      setPromotion(data);
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    }
  };

  const fetchApplicableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("promotion_products")
        .select(
          `
          product:products(
            *,
            images:product_images(url, alt_text, is_primary)
          )
        `,
        )
        .eq("promotion_id", promotionId);

      if (error) throw error;

      const products =
        data?.map((item: any) => ({
          ...item.product,
          images:
            item.product?.images?.sort(
              (a: any, b: any) =>
                (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0),
            ) || [],
        })) || [];

      setApplicableProducts(products as Product[]);
    } catch (error) {
      console.error("Error fetching applicable products:", error);
    }
  };

  const getDiscountText = () => {
    if (!promotion) return "";

    switch (promotion.promotion_type) {
      case "percentage":
        return `${promotion.discount_value}% OFF`;
      case "fixed_amount":
        return `$${promotion.discount_value} OFF`;
      case "buy_x_get_y":
        return `Buy ${(promotion as any).buy_quantity || 2} Get ${(promotion as any).get_quantity || 1}`;
      case "free_shipping":
        return "FREE SHIPPING";
      default:
        return "SPECIAL OFFER";
    }
  };

  const getTimeRemaining = () => {
    if (!promotion?.end_date) return null;

    const now = new Date();
    const endDate = new Date(promotion.end_date);
    const timeDiff = endDate.getTime() - now.getTime();

    if (timeDiff <= 0) return "Promotion expired";

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton}>
        <Ionicons name="share-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderPromotionImage = () => (
    <View style={styles.imageContainer}>
      {promotion?.image_url ? (
        <Image
          source={{
            uri: optimizeImageUrl(promotion.image_url, screenWidth, 300),
          }}
          style={styles.promotionImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.promotionImagePlaceholder}
        >
          <Ionicons name="pricetag" size={80} color={COLORS.white} />
        </LinearGradient>
      )}

      <View style={styles.discountBadge}>
        <Text style={styles.discountBadgeText}>{getDiscountText()}</Text>
      </View>
    </View>
  );

  const renderPromotionInfo = () => (
    <View style={styles.promotionInfo}>
      <Text style={styles.promotionTitle}>{promotion?.title}</Text>

      {getTimeRemaining() && (
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.warning} />
          <Text style={styles.timeRemaining}>{getTimeRemaining()}</Text>
        </View>
      )}

      <Text style={styles.promotionDescription}>{promotion?.description}</Text>

      {(promotion as any)?.terms_and_conditions && (
        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>Terms and Conditions:</Text>
          <Text style={styles.termsText}>
            {(promotion as any).terms_and_conditions}
          </Text>
        </View>
      )}

      <View style={styles.validityContainer}>
        <Text style={styles.validityTitle}>Valid from:</Text>
        <Text style={styles.validityText}>
          {promotion?.start_date ? formatDate(promotion.start_date) : "N/A"} -{" "}
          {promotion?.end_date ? formatDate(promotion.end_date) : "N/A"}
        </Text>
      </View>
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
          source={{ uri: optimizeImageUrl(item.images[0].url, 150, 150) }}
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
      </View>
    </TouchableOpacity>
  );

  const renderApplicableProducts = () => (
    <View style={styles.productsSection}>
      <Text style={styles.sectionTitle}>Products on Promotion</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
      >
        {applicableProducts.map((product) => (
          <View key={product.id} style={styles.productWrapper}>
            {renderProductCard({ item: product })}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading promotion details">
        {null}
      </LoadingState>
    );
  }

  if (!promotion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.error}
          />
          <Text style={styles.errorTitle}>Promotion not found</Text>
          <Text style={styles.errorSubtitle}>
            The promotion you're looking for doesn't exist or has been deleted
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backToPromotionsButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderPromotionImage()}
        {renderPromotionInfo()}
        {applicableProducts.length > 0 && renderApplicableProducts()}
      </ScrollView>

      {renderHeader()}

      <View style={styles.bottomActions}>
        <Button
          title="Explore Products"
          onPress={() => navigation.navigate("Catalog", { promotionId })}
          fullWidth
        />
      </View>
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
    paddingBottom: 100, // Space for bottom actions
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    height: 300,
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
  discountBadge: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  discountBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: "bold",
  },
  promotionInfo: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  promotionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  timeRemaining: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.warning,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  promotionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  termsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  termsTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  termsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  validityContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  validityTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  validityText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  productsSection: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  productsList: {
    paddingHorizontal: SPACING.lg,
  },
  productWrapper: {
    marginRight: SPACING.md,
  },
  productCard: {
    width: 150,
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
    height: 150,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 150,
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
  },
  productPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  productDiscountedPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "bold",
    marginRight: SPACING.sm,
  },
  productOriginalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  backToPromotionsButton: {
    alignSelf: "center",
  },
});

export default PromotionDetailsScreen;
