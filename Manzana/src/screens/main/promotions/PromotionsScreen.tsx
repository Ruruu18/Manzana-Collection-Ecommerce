import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { Promotion, Category, PromotionFilters } from "../../../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  PROMOTION_TYPES,
} from "../../../constants/theme";
import {
  formatCurrency,
  optimizeImageUrl,
  getTimeUntilDate,
  getCategoryIcon,
} from "../../../utils";
import LoadingState from "../../../components/LoadingState";
import Button from "../../../components/Button";

const { width: screenWidth } = Dimensions.get("window");
const PROMOTION_CARD_WIDTH = screenWidth - SPACING.lg * 2;

interface PromotionsScreenProps {
  navigation: any;
}

interface CountdownTimerProps {
  endDate: string;
  label?: string;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  label = "Ends in:",
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDate(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = getTimeUntilDate(endDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.expiredText}>Promotion expired!</Text>
      </View>
    );
  }

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownLabel}>{label}</Text>
      <View style={styles.countdownTimer}>
        {timeLeft.days > 0 && (
          <>
            <View style={styles.timeUnit}>
              <Text style={styles.timeNumber}>{String(timeLeft.days)}</Text>
              <Text style={styles.timeLabel}>days</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
          </>
        )}
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>
            {timeLeft.hours.toString().padStart(2, "0")}
          </Text>
          <Text style={styles.timeLabel}>hrs</Text>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>
            {timeLeft.minutes.toString().padStart(2, "0")}
          </Text>
          <Text style={styles.timeLabel}>min</Text>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeUnit}>
          <Text style={styles.timeNumber}>
            {timeLeft.seconds.toString().padStart(2, "0")}
          </Text>
          <Text style={styles.timeLabel}>sec</Text>
        </View>
      </View>
    </View>
  );
};

const PromotionsScreen: React.FC<PromotionsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PromotionFilters>({
    activeOnly: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPromotions(), fetchCategories()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const now = new Date().toISOString();
      let query = supabase.from("promotions").select("*");

      // Apply filters
      if (filters.activeOnly) {
        // Show active promotions AND scheduled promotions (starting in the future)
        // Split into two separate queries and combine
        const activeQuery = supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true)
          .lte("start_date", now)
          .gte("end_date", now);

        const scheduledQuery = supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true)
          .gt("start_date", now);

        const [activeResult, scheduledResult] = await Promise.all([
          activeQuery,
          scheduledQuery,
        ]);

        if (activeResult.error) throw activeResult.error;
        if (scheduledResult.error) throw scheduledResult.error;

        let combinedData = [
          ...(activeResult.data || []),
          ...(scheduledResult.data || []),
        ];

        // Apply additional filters to combined data
        if (filters.type) {
          combinedData = combinedData.filter(
            (item) => item.promotion_type === filters.type
          );
        }

        if (filters.category) {
          combinedData = combinedData.filter((item) =>
            item.applicable_ids?.includes(filters.category)
          );
        }

        if (filters.userType && user?.user_type) {
          combinedData = combinedData.filter(
            (item) =>
              !item.user_type_restriction ||
              item.user_type_restriction === user.user_type
          );
        }

        // Sort by start date
        combinedData.sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        setPromotions(combinedData);
        return;
      }

      // For non-activeOnly filters, use regular query
      if (filters.type) {
        query = query.eq("promotion_type", filters.type);
      }

      if (filters.category) {
        query = query.contains("applicable_ids", [filters.category]);
      }

      if (filters.userType && user?.user_type) {
        query = query.or(
          `user_type_restriction.is.null,user_type_restriction.eq.${user.user_type}`
        );
      }

      query = query.order("start_date", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPromotions();
    setRefreshing(false);
  };

  const handlePromotionPress = (promotion: Promotion) => {
    navigation.navigate("PromotionDetails", { promotionId: promotion.id });
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchPromotions();
  };

  const clearFilters = () => {
    setFilters({ activeOnly: true });
    setShowFilters(false);
    fetchPromotions();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Promotions</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {user?.user_type === "reseller" && (
        <View style={styles.resellerBanner}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.primary]}
            style={styles.resellerGradient}
          >
            <Ionicons name="business" size={20} color={COLORS.white} />
            <Text style={styles.resellerText}>
              Special promotions for resellers available
            </Text>
          </LinearGradient>
        </View>
      )}

      <Text style={styles.subtitle}>
        Discover the best deals and exclusive promotions
      </Text>
    </View>
  );

  const renderPromotionCard = ({ item }: { item: Promotion }) => {
    const getPromotionBadgeText = () => {
      switch (item.promotion_type) {
        case "percentage":
          return `${item.discount_value}% OFF`;
        case "fixed_amount":
          return `₱${item.discount_value} OFF`;
        case "buy_x_get_y":
          return "BUY & GET";
        default:
          return "OFFER";
      }
    };

    const getBadgeColor = () => {
      switch (item.promotion_type) {
        case "percentage":
          return COLORS.error;
        case "fixed_amount":
          return COLORS.warning;
        case "buy_x_get_y":
          return COLORS.info;
        default:
          return COLORS.primary;
      }
    };

    return (
      <TouchableOpacity
        style={styles.promotionCard}
        onPress={() => handlePromotionPress(item)}
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
            <Ionicons name="pricetag" size={60} color={COLORS.white} />
          </LinearGradient>
        )}

        <View style={styles.promotionContent}>
          <View
            style={[
              styles.promotionBadge,
              { backgroundColor: getBadgeColor() },
            ]}
          >
            <Text style={styles.promotionBadgeText}>
              {(() => {
                const now = new Date();
                const startDate = new Date(item.start_date);
                
                if (now < startDate) {
                  return `📅 COMING SOON - ${getPromotionBadgeText()}`;
                } else {
                  return getPromotionBadgeText();
                }
              })()}
            </Text>
          </View>

          <Text style={styles.promotionTitle}>{item.title}</Text>
          <Text style={styles.promotionDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {item.min_purchase_amount && (
            <Text style={styles.minPurchaseText}>
              Minimum purchase: {formatCurrency(item.min_purchase_amount)}
            </Text>
          )}

          {item.user_type_restriction && (
            <View style={styles.userTypeRestriction}>
              <Ionicons
                name={
                  item.user_type_restriction === "reseller"
                    ? "business"
                    : "person"
                }
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.userTypeText}>
                Only for{" "}
                {item.user_type_restriction === "reseller"
                  ? "resellers"
                  : "consumers"}
              </Text>
            </View>
          )}

          {/* Show countdown timer based on promotion status */}
          {(() => {
            const now = new Date();
            const startDate = new Date(item.start_date);
            const endDate = new Date(item.end_date);
            
            if (now < startDate) {
              // Promotion hasn't started yet - show countdown to start
              return (
                <CountdownTimer
                  endDate={item.start_date}
                  label="🚀 Starts in:"
                  onExpire={() => fetchPromotions()}
                />
              );
            } else if (now >= startDate && now <= endDate) {
              // Promotion is active - show countdown to end
              return (
                <CountdownTimer
                  endDate={item.end_date}
                  label="⏰ Ends in:"
                  onExpire={() => fetchPromotions()}
                />
              );
            } else {
              // Promotion has ended
              return (
                <View style={styles.countdownContainer}>
                  <Text style={styles.expiredText}>⏰ This promotion has ended</Text>
                </View>
              );
            }
          })()}

          <View style={styles.promotionFooter}>
            <View style={styles.usageInfo}>
              {item.usage_limit && (
                <Text style={styles.usageText}>
                  Uses: {item.usage_count}/{item.usage_limit}
                </Text>
              )}
            </View>

            <Button
              title="View Details"
              onPress={() => handlePromotionPress(item)}
              size="small"
              style={styles.detailsButton}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="pricetag-outline"
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>No promotions available</Text>
      <Text style={styles.emptySubtitle}>New promotions will appear here</Text>
      <Button
        title="Explore products"
        onPress={() => navigation.navigate("Catalog")}
        variant="outline"
        style={styles.exploreButton}
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
          {/* Promotion Type */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Promotion type</Text>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({ ...prev, type: undefined }))
              }
            >
              <Text
                style={[
                  styles.filterOptionText,
                  !filters.type && styles.filterOptionActive,
                ]}
              >
                All promotions
              </Text>
              {!filters.type && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            {Object.entries(PROMOTION_TYPES).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.filterOption}
                onPress={() =>
                  setFilters((prev) => ({ ...prev, type: key as any }))
                }
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.type === key && styles.filterOptionActive,
                  ]}
                >
                  {label}
                </Text>
                {filters.type === key && (
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

          {/* Other Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status</Text>

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  activeOnly: !filters.activeOnly,
                }))
              }
            >
              <Text style={styles.filterOptionText}>
                Only active promotions
              </Text>
              <View
                style={[
                  styles.checkbox,
                  filters.activeOnly && styles.checkboxActive,
                ]}
              >
                {filters.activeOnly && (
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
      <LoadingState loading={loading} emptyMessage="Loading promotions">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={promotions}
        renderItem={renderPromotionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  resellerBanner: {
    marginBottom: SPACING.md,
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
    flex: 1,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  listContent: {
    padding: SPACING.lg,
  },
  promotionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.lg,
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
    padding: SPACING.lg,
  },
  promotionBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  promotionBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  promotionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  promotionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  minPurchaseText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  userTypeRestriction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  userTypeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  countdownContainer: {
    marginBottom: SPACING.md,
  },
  countdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  countdownTimer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeUnit: {
    alignItems: "center",
    minWidth: 40,
  },
  timeNumber: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  timeSeparator: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  expiredText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: "600",
  },
  promotionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usageInfo: {
    flex: 1,
  },
  usageText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  detailsButton: {
    alignSelf: "flex-end",
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
    textAlign: "center",
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  exploreButton: {
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

export default PromotionsScreen;
