import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { supabase } from "../../../services/supabase";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../../constants/theme";
import Button from "../../../components/Button";
import UserAvatar from "../../../components/UserAvatar";

interface ProfileScreenProps {
  navigation: any;
}

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  badge?: number;
  iconColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  badge,
  iconColor = COLORS.primary,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{String(title)}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{String(subtitle)}</Text>}
      </View>
    </View>

    <View style={styles.menuItemRight}>
      {badge && badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge > 99 ? "99+" : String(badge)}</Text>
        </View>
      )}
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      )}
    </View>
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [stats, setStats] = React.useState({
    ordersCount: 0,
    wishlistCount: 0,
    alertsCount: 0,
  });

  React.useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Load active orders count (exclude delivered and cancelled)
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("status", "in", '("delivered","cancelled")');

      // Load wishlist count
      const { count: wishlistCount } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load active alerts count
      const { count: alertsCount } = await supabase
        .from("stock_alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

      setStats({
        ordersCount: ordersCount || 0,
        wishlistCount: wishlistCount || 0,
        alertsCount: alertsCount || 0,
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const calculateProfileCompletion = () => {
    let completion = 25; // Base completion for having an account
    if (user?.full_name) completion += 25;
    if (user?.email) completion += 25;
    if (user?.phone) completion += 25;
    return completion;
  };

  const getMemberSince = () => {
    if (!user?.created_at) return "";
    const date = new Date(user.created_at);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const renderUserHeader = () => {
    const completion = calculateProfileCompletion();
    const memberSince = getMemberSince();

    return (
      <View style={styles.userHeader}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.userHeaderGradient}
        >
          <View style={styles.userInfo}>
            <UserAvatar
              fullName={user?.full_name || "User"}
              size={80}
              onPress={() => navigation.navigate("EditProfile")}
              showEditIcon={true}
            />

            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.full_name || user?.email?.split('@')[0] || "User"}
              </Text>
              <Text style={styles.userEmail}>{user?.email || "Loading..."}</Text>
              <View style={styles.userMetaRow}>
                {user?.user_type && (
                  <View style={styles.userTypeBadge}>
                    <Ionicons
                      name={user.user_type === "reseller" ? "business" : "person"}
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.userTypeText}>
                      {user.user_type === "reseller" ? "Reseller" : "Consumer"}
                    </Text>
                  </View>
                )}
                {memberSince && (
                  <Text style={styles.memberSince}>Member since {memberSince}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Profile Completion */}
          {completion < 100 && (
            <TouchableOpacity
              style={styles.profileCompletionCard}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={styles.profileCompletionHeader}>
                <Text style={styles.profileCompletionText}>
                  Profile {completion}% complete
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completion}%` }]} />
              </View>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => navigation.navigate("OrderHistory")}
      >
        <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
        <Text style={styles.statValue}>{stats.ordersCount}</Text>
        <Text style={styles.statLabel}>Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statCard}
        onPress={() => navigation.navigate("Wishlist")}
      >
        <Ionicons name="heart-outline" size={24} color={COLORS.error} />
        <Text style={styles.statValue}>{stats.wishlistCount}</Text>
        <Text style={styles.statLabel}>Wishlist</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statCard}
        onPress={() => navigation.navigate("StockAlerts")}
      >
        <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
        <Text style={styles.statValue}>{stats.alertsCount}</Text>
        <Text style={styles.statLabel}>Alerts</Text>
      </TouchableOpacity>
    </View>
  );


  const renderActivitySection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>My Activity</Text>

      <MenuItem
        icon="receipt-outline"
        title="Orders"
        subtitle="My previous purchases"
        onPress={() => navigation.navigate("OrderHistory")}
      />

      <MenuItem
        icon="heart-outline"
        title="Wishlist"
        subtitle="Products I like"
        onPress={() => navigation.navigate("Wishlist")}
      />

      <MenuItem
        icon="notifications-outline"
        title="Stock Alerts"
        subtitle="Product notifications"
        onPress={() => navigation.navigate("StockAlerts")}
      />
    </View>
  );


  const renderSupportSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>Settings & Support</Text>

      <MenuItem
        icon="settings-outline"
        title="Settings"
        subtitle="Notifications and preferences"
        onPress={() => navigation.navigate("Settings")}
        badge={unreadCount > 0 ? unreadCount : undefined}
      />

      <MenuItem
        icon="help-circle-outline"
        title="Help Center"
        subtitle="Frequently asked questions and guides"
        onPress={() => navigation.navigate("HelpCenter")}
      />

      <MenuItem
        icon="chatbubble-outline"
        title="Contact"
        subtitle="Send message to support"
        onPress={() => navigation.navigate("Contact")}
      />

      <MenuItem
        icon="shield-checkmark-outline"
        title="Terms and Conditions"
        onPress={() => navigation.navigate("TermsAndConditions")}
      />

      <MenuItem
        icon="document-text-outline"
        title="Privacy Policy"
        onPress={() => navigation.navigate("PrivacyPolicy")}
      />
    </View>
  );

  const renderBusinessSection = () => {
    if (user?.user_type !== "reseller") return null;

    return (
      <View style={styles.businessSection}>
        <View style={styles.businessHeader}>
          <Ionicons name="business" size={20} color={COLORS.secondary} />
          <Text style={styles.businessTitle}>Business Tools</Text>
        </View>

        <MenuItem
          icon="business-outline"
          title="Business Information"
          subtitle={user?.business_name || "Set up business data"}
          onPress={() => navigation.navigate("EditProfile")}
          iconColor={COLORS.secondary}
        />

        <MenuItem
          icon="analytics-outline"
          title="Sales Reports"
          subtitle="Statistics and analytics"
          onPress={() => {
            Alert.alert("Coming Soon", "Sales reports feature will be available soon.");
          }}
          iconColor={COLORS.secondary}
        />

        <MenuItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Configure billing"
          onPress={() => {
            Alert.alert("Coming Soon", "Payment methods feature will be available soon.");
          }}
          iconColor={COLORS.secondary}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderUserHeader()}
        {renderStatsCards()}
        {renderActivitySection()}
        {renderBusinessSection()}
        {renderSupportSection()}

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            icon="log-out-outline"
            style={styles.signOutButton}
            fullWidth
          />
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Manzana Colección v1.0.0</Text>
        </View>
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
  userHeader: {
    marginBottom: SPACING.xl,
  },
  userHeaderGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: SPACING.lg,
    position: "relative",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flexWrap: "wrap",
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  userTypeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: "600",
  },
  memberSince: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.8,
  },
  profileCompletionCard: {
    marginTop: SPACING.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  profileCompletionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  profileCompletionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontWeight: "bold",
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  businessSection: {
    backgroundColor: `${COLORS.secondary}10`,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${COLORS.secondary}30`,
  },
  businessHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: `${COLORS.secondary}20`,
    gap: SPACING.sm,
  },
  businessTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    fontWeight: "700",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    minHeight: 64,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
  },
  menuSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginRight: SPACING.sm,
  },
  menuBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  signOutContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  signOutButton: {
    borderColor: COLORS.error,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen;
