import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";

interface NotificationSettings {
  promotions: boolean;
  stockAlerts: boolean;
  orders: boolean;
  general: boolean;
  email: boolean;
  push: boolean;
}

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      promotions: true,
      stockAlerts: true,
      orders: true,
      general: true,
      email: true,
      push: true,
    });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("notificationSettings");
      if (settings) {
        setNotificationSettings(JSON.parse(settings));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const updateNotificationSetting = async (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem(
        "notificationSettings",
        JSON.stringify(newSettings),
      );

      // Update user preferences in database
      if (user) {
        await supabase.from("user_preferences").upsert({
          user_id: user.id,
          notification_settings: newSettings,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      Alert.alert("Error", "Could not save settings");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Could not sign out");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const clearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will remove all temporary data from the app. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              // Clear specific cache keys but keep important settings
              const keysToKeep = ["notificationSettings", "userPreferences"];
              const allKeys = await AsyncStorage.getAllKeys();
              const keysToRemove = allKeys.filter(
                (key) => !keysToKeep.includes(key),
              );

              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }

              Alert.alert("Success", "Cache cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Could not clear cache");
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
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    icon: string,
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.gray300, true: COLORS.secondary }}
        thumbColor={value ? COLORS.primary : COLORS.gray500}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    subtitle: string,
    onPress: () => void,
    icon: string,
    color: string = COLORS.text,
    showChevron: boolean = true,
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color }]}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        {renderSection(
          "Account",
          <>
            {renderActionItem(
              "Edit Profile",
              "Update your personal information",
              () => navigation.navigate("EditProfile"),
              "person-outline",
            )}
            {renderActionItem(
              "Order History",
              "View your previous purchases",
              () => navigation.navigate("OrderHistory"),
              "receipt-outline",
            )}
            {renderActionItem(
              "Wishlist",
              "Products you like",
              () => navigation.navigate("Wishlist"),
              "heart-outline",
            )}
          </>,
        )}

        {/* Notifications Section */}
        {renderSection(
          "Notifications",
          <>
            {renderSettingItem(
              "Promotions",
              "Receive notifications about special offers",
              notificationSettings.promotions,
              (value) => updateNotificationSetting("promotions", value),
              "pricetag-outline",
            )}
            {renderSettingItem(
              "Stock Alerts",
              "Notifications when products become available again",
              notificationSettings.stockAlerts,
              (value) => updateNotificationSetting("stockAlerts", value),
              "notifications-outline",
            )}
            {renderSettingItem(
              "Orders",
              "Updates about your order status",
              notificationSettings.orders,
              (value) => updateNotificationSetting("orders", value),
              "cube-outline",
            )}
            {renderSettingItem(
              "Push Notifications",
              "Receive notifications on your device",
              notificationSettings.push,
              (value) => updateNotificationSetting("push", value),
              "phone-portrait-outline",
            )}
            {renderSettingItem(
              "Email Notifications",
              "Receive notifications via email",
              notificationSettings.email,
              (value) => updateNotificationSetting("email", value),
              "mail-outline",
            )}
          </>,
        )}

        {/* App Section */}
        {renderSection(
          "Application",
          <>
            {renderActionItem(
              "Clear Cache",
              "Free up space by removing temporary data",
              clearCache,
              "trash-outline",
            )}
            {renderActionItem(
              "About",
              "Information about the application",
              () =>
                Alert.alert(
                  "Manzana Collection",
                  "Version 1.0.0\n\nDeveloped with ❤️ for resellers",
                ),
              "information-circle-outline",
            )}
            {renderActionItem(
              "Help & Support",
              "Get help or contact support",
              () =>
                Alert.alert(
                  "Support",
                  "Contact us at support@manzanacollection.com",
                ),
              "help-circle-outline",
            )}
          </>,
        )}

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            loading={loading}
            variant="outline"
            fullWidth
            style={styles.signOutButton}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  settingSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  signOutSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  signOutButton: {
    borderColor: COLORS.error,
  },
});

export default SettingsScreen;
