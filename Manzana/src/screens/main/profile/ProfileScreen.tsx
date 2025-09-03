import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { optimizeImageUrl } from "../../../utils";
import Button from "../../../components/Button";

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

  // Debug user data
  console.log("🔍 ProfileScreen - User data:", {
    hasUser: !!user,
    userId: user?.id,
    fullName: user?.full_name,
    email: user?.email,
    userType: user?.user_type,
    rawUser: user
  });

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

  const renderUserHeader = () => (
    <View style={styles.userHeader}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.userHeaderGradient}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: optimizeImageUrl(user.avatar_url, 120, 120) }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.white} />
              </View>
            )}
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.full_name || user?.email?.split('@')[0] || "User"}
            </Text>
            <Text style={styles.userEmail}>{user?.email || "Loading..."}</Text>
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
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="pencil" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>My Account</Text>

      <MenuItem
        icon="person-circle-outline"
        title="Edit Profile"
        subtitle="Personal information and settings"
        onPress={() => navigation.navigate("EditProfile")}
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

      <MenuItem
        icon="receipt-outline"
        title="Order History"
        subtitle="My previous purchases"
        onPress={() => navigation.navigate("OrderHistory")}
      />
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>Preferences</Text>

      <MenuItem
        icon="settings-outline"
        title="Settings"
        subtitle="Notifications and preferences"
        onPress={() => navigation.navigate("Settings")}
        badge={unreadCount > 0 ? unreadCount : undefined}
      />

      <MenuItem
        icon="language-outline"
        title="Language"
        subtitle="English"
        onPress={() => {
          /* TODO: Implement language selection */
        }}
      />

      <MenuItem
        icon="moon-outline"
        title="Theme"
        subtitle="Light"
        onPress={() => {
          /* TODO: Implement theme selection */
        }}
      />
    </View>
  );

  const renderSupportSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>Support</Text>

      <MenuItem
        icon="help-circle-outline"
        title="Help Center"
        subtitle="Frequently asked questions and guides"
        onPress={() => {
          /* TODO: Implement help center */
        }}
      />

      <MenuItem
        icon="chatbubble-outline"
        title="Contact"
        subtitle="Send message to support"
        onPress={() => {
          /* TODO: Implement contact */
        }}
      />

      <MenuItem
        icon="shield-checkmark-outline"
        title="Terms and Conditions"
        onPress={() => {
          /* TODO: Implement terms */
        }}
      />

      <MenuItem
        icon="document-text-outline"
        title="Privacy Policy"
        onPress={() => {
          /* TODO: Implement privacy policy */
        }}
      />
    </View>
  );

  const renderBusinessSection = () => {
    if (user?.user_type !== "reseller") return null;

    return (
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Business</Text>

        <MenuItem
          icon="business-outline"
          title="Business Information"
          subtitle={user?.business_name || "Set up business data"}
          onPress={() => navigation.navigate("EditProfile")}
        />

        <MenuItem
          icon="analytics-outline"
          title="Sales Reports"
          subtitle="Statistics and analytics"
          onPress={() => {
            /* TODO: Implement sales reports */
          }}
        />

        <MenuItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Configure billing"
          onPress={() => {
            /* TODO: Implement payment methods */
          }}
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
        {renderAccountSection()}
        {renderBusinessSection()}
        {renderPreferencesSection()}
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
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.sm,
  },
  userTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-start",
  },
  userTypeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: "600",
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
