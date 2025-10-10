import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Switch,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import { formatCurrency, optimizeImageUrl } from "../../utils";
import LoadingState from "../../components/LoadingState";
import Button from "../../components/Button";

interface StockAlert {
  id: string;
  product_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    images: Array<{
      url: string;
      alt_text: string;
      is_primary: boolean;
    }>;
  };
}

interface StockAlertHistory {
  id: string;
  product_id: string;
  alert_type: "back_in_stock" | "low_stock" | "price_drop";
  message: string;
  created_at: string;
  product: {
    name: string;
    price: number;
  };
}

interface StockAlertsScreenProps {
  navigation: any;
}

const StockAlertsScreen: React.FC<StockAlertsScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "subscriptions" | "history" | "restocked"
  >("subscriptions");
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<StockAlertHistory[]>([]);
  const [recentlyRestocked, setRecentlyRestocked] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStockAlerts(),
        fetchAlertHistory(),
        fetchRecentlyRestocked(),
      ]);
    } catch (error) {
      console.error("Error loading stock alerts data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const fetchStockAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select(
          `
          *,
          product:products(
            id,
            name,
            price,
            stock_quantity,
            images:product_images(url, alt_text, is_primary)
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStockAlerts(data || []);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    }
  };

  const fetchAlertHistory = async () => {
    if (!user) return;

    try {
      // Fetch inactive alerts as history
      const { data, error } = await supabase
        .from("stock_alerts")
        .select(
          `
          *,
          product:products(
            id,
            name,
            price,
            stock_quantity,
            images:product_images(url, alt_text, is_primary)
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("is_active", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to match StockAlertHistory interface
      const transformedData = (data || []).map(alert => ({
        id: alert.id,
        product_id: alert.product_id,
        alert_type: 'back_in_stock' as const,
        message: `Stock alert for ${alert.product?.name || 'product'}`,
        created_at: alert.created_at,
        product: {
          name: alert.product?.name || '',
          price: alert.product?.price || 0,
        }
      }));

      setAlertHistory(transformedData);
    } catch (error) {
      console.error("Error fetching alert history:", error);
    }
  };

  const fetchRecentlyRestocked = async () => {
    try {
      // Fetch products that are currently in stock
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          images:product_images(url, alt_text, is_primary)
        `,
        )
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentlyRestocked(data || []);
    } catch (error) {
      console.error("Error fetching recently restocked products:", error);
    }
  };

  const toggleStockAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("stock_alerts")
        .update({ is_active: isActive })
        .eq("id", alertId);

      if (error) throw error;

      setStockAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_active: isActive } : alert,
        ),
      );
    } catch (error) {
      console.error("Error toggling stock alert:", error);
      Alert.alert("Error", "Could not update the alert");
    }
  };

  const removeStockAlert = async (alertId: string) => {
    Alert.alert(
      "Remove Alert",
      "Are you sure you want to remove this stock alert?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("stock_alerts")
                .delete()
                .eq("id", alertId);

              if (error) throw error;

              setStockAlerts((prev) =>
                prev.filter((alert) => alert.id !== alertId),
              );
            } catch (error) {
              console.error("Error removing stock alert:", error);
              Alert.alert("Error", "Could not remove the alert");
            }
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Stock Alerts</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "subscriptions" && styles.activeTab]}
        onPress={() => setActiveTab("subscriptions")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "subscriptions" && styles.activeTabText,
          ]}
        >
          My Alerts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "history" && styles.activeTab]}
        onPress={() => setActiveTab("history")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "history" && styles.activeTabText,
          ]}
        >
          History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "restocked" && styles.activeTab]}
        onPress={() => setActiveTab("restocked")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "restocked" && styles.activeTabText,
          ]}
          numberOfLines={1}
        >
          Restocked
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStockAlertCard = ({ item }: { item: StockAlert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertContent}>
        {item.product.images && item.product.images.length > 0 ? (
          <Image
            source={{
              uri: optimizeImageUrl(item.product.images[0].url, 60, 60),
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={24}
              color={COLORS.textSecondary}
            />
          </View>
        )}

        <View style={styles.alertInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.productPrice}>
            {formatCurrency(item.product.price)}
          </Text>
          <Text style={styles.stockStatus}>
            {item.product.stock_quantity > 0
              ? `${item.product.stock_quantity} available`
              : "Out of stock"}
          </Text>
        </View>

        <View style={styles.alertActions}>
          <Switch
            value={item.is_active}
            onValueChange={(value) => toggleStockAlert(item.id, value)}
            trackColor={{ false: COLORS.gray300, true: COLORS.secondary }}
            thumbColor={item.is_active ? COLORS.primary : COLORS.gray500}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeStockAlert(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LoadingState loading={loading} emptyMessage="Loading stock alerts">
        {null}
      </LoadingState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "subscriptions" && (
          <View style={styles.tabContent}>
            {stockAlerts.length > 0 ? (
              <FlatList
                data={stockAlerts}
                renderItem={renderStockAlertCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={{ height: SPACING.sm }} />
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>You have no active alerts</Text>
                <Text style={styles.emptySubtitle}>
                  Add stock alerts from the products you're interested in
                </Text>
                <Button
                  title="Explore Products"
                  onPress={() => navigation.navigate("Catalog")}
                  style={styles.exploreButton}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === "history" && (
          <View style={styles.tabContent}>
            {alertHistory.length > 0 ? (
              <FlatList
                data={alertHistory}
                renderItem={({ item }) => (
                  <View style={styles.alertCard}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <Text style={styles.productPrice}>
                      {formatCurrency(item.product.price)}
                    </Text>
                    <Text style={styles.stockStatus}>{item.message}</Text>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={{ height: SPACING.sm }} />
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="time-outline"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>No alert history</Text>
                <Text style={styles.emptySubtitle}>
                  Your past alerts will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "restocked" && (
          <View style={styles.tabContent}>
            {recentlyRestocked.length > 0 ? (
              <FlatList
                data={recentlyRestocked}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.alertCard}
                    onPress={() =>
                      navigation.navigate("ProductDetails", {
                        productId: item.id,
                      })
                    }
                  >
                    <View style={styles.alertContent}>
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{
                            uri: optimizeImageUrl(item.images[0].url, 60, 60),
                          }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color={COLORS.textSecondary}
                          />
                        </View>
                      )}
                      <View style={styles.alertInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.productPrice}>
                          {formatCurrency(item.price)}
                        </Text>
                        <Text style={styles.stockStatus}>
                          {item.stock_quantity} in stock
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View style={{ height: SPACING.sm }} />
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cube-outline"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>No restocked products</Text>
                <Text style={styles.emptySubtitle}>
                  Recently restocked products will appear here
                </Text>
              </View>
            )}
          </View>
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
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  tabContent: {
    flex: 1,
  },
  alertCard: {
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
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  alertInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  productName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  productPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  stockStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  alertActions: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
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

export default StockAlertsScreen;
