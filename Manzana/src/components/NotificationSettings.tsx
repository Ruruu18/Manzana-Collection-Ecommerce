import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { notificationService } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface NotificationSettingsProps {
  onPermissionChange?: (granted: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onPermissionChange,
}) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [preferences, setPreferences] = useState({
    push_promotions: true,
    push_stock_alerts: true,
    push_new_products: true,
    push_order_updates: true,
  });

  useEffect(() => {
    checkPermissionStatus();
    loadPreferences();
  }, []);

  const checkPermissionStatus = async () => {
    // Check permission without requesting
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
  };

  const loadPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    if (data?.notification_preferences) {
      setPreferences({
        push_promotions: data.notification_preferences.push_promotions ?? true,
        push_stock_alerts: data.notification_preferences.push_stock_alerts ?? true,
        push_new_products: data.notification_preferences.push_new_products ?? true,
        push_order_updates: data.notification_preferences.push_order_updates ?? true,
      });
    }
  };

  const handleRequestPermission = async () => {
    const { status: currentStatus } = await Notifications.getPermissionsAsync();

    // If previously denied, prompt user to go to settings
    if (currentStatus === 'denied') {
      Alert.alert(
        'Permission Previously Denied',
        'You previously denied notification permissions. Please enable notifications in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    // Request permission
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);

    if (granted && user) {
      await notificationService.registerDeviceToken(user.id);
      Alert.alert('Success', 'Notifications enabled! You will now receive updates.');
    } else {
      Alert.alert(
        'Permission Denied',
        'Notifications are disabled. You can enable them later in Settings.',
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }

    onPermissionChange?.(granted);
  };

  const handleTogglePreference = async (key: keyof typeof preferences) => {
    if (!user) return;

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);

    // Update in database
    const { error } = await supabase
      .from('users')
      .update({
        notification_preferences: {
          ...user.notification_preferences,
          ...newPreferences,
        },
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  return (
    <View style={styles.container}>
      {/* Permission Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          {!hasPermission && (
            <TouchableOpacity
              onPress={checkPermissionStatus}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {!hasPermission ? (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={handleRequestPermission}
          >
            <View style={styles.permissionContent}>
              <Ionicons name="alert-circle-outline" size={24} color={COLORS.warning} />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>Enable Notifications</Text>
                <Text style={styles.permissionDescription}>
                  Get updates about your orders, new products, and special offers
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.permissionEnabled}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.permissionEnabledText}>Notifications Enabled</Text>
          </View>
        )}
      </View>

      {/* Notification Preferences */}
      {hasPermission && (
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Notification Types</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Promotions & Offers</Text>
                <Text style={styles.preferenceDescription}>
                  Special deals and discounts
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.push_promotions}
              onValueChange={() => handleTogglePreference('push_promotions')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Stock Alerts</Text>
                <Text style={styles.preferenceDescription}>
                  When products you want are back in stock
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.push_stock_alerts}
              onValueChange={() => handleTogglePreference('push_stock_alerts')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="sparkles-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>New Products</Text>
                <Text style={styles.preferenceDescription}>
                  Latest arrivals and collections
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.push_new_products}
              onValueChange={() => handleTogglePreference('push_new_products')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Order Updates</Text>
                <Text style={styles.preferenceDescription}>
                  Status changes and pickup reminders
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.push_order_updates}
              onValueChange={() => handleTogglePreference('push_order_updates')}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  permissionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  permissionEnabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.success}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  permissionEnabledText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  preferenceDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});

export default NotificationSettings;
