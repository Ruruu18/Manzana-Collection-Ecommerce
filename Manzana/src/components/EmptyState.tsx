import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  accessible?: boolean;
  accessibilityLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  accessible = true,
  accessibilityLabel,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${title}. ${message}`}
      accessibilityRole="text"
    >
      <View
        style={styles.iconContainer}
        accessible={true}
        accessibilityLabel={`${icon} icon`}
        accessibilityRole="image"
      >
        <Ionicons name={icon} size={80} color={COLORS.textSecondary} />
      </View>

      <Text style={styles.title} accessible={true} accessibilityRole="header">
        {title}
      </Text>

      <Text style={styles.message} accessible={true}>
        {message}
      </Text>

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
          accessible={true}
          accessibilityLabel={actionLabel}
          accessibilityHint={`Double tap to ${actionLabel.toLowerCase()}`}
        />
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Button
          title={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="outline"
          style={styles.secondaryButton}
          accessible={true}
          accessibilityLabel={secondaryActionLabel}
          accessibilityHint={`Double tap to ${secondaryActionLabel.toLowerCase()}`}
        />
      )}
    </View>
  );
};

// Preset empty states for common scenarios
export const EmptyCart: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="cart-outline"
    title="Your cart is empty"
    message="Add some products to your cart to get started with your order."
    {...props}
  />
);

export const EmptyWishlist: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="heart-outline"
    title="No wishlist items"
    message="Save your favorite products to your wishlist for easy access later."
    {...props}
  />
);

export const EmptyOrders: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="receipt-outline"
    title="No orders yet"
    message="When you make your first purchase, it will appear here."
    {...props}
  />
);

export const EmptyNotifications: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="notifications-outline"
    title="No notifications"
    message="You're all caught up! We'll notify you when there's something new."
    {...props}
  />
);

export const EmptySearch: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="search-outline"
    title="No results found"
    message="We couldn't find any products matching your search. Try different keywords."
    {...props}
  />
);

export const EmptyReviews: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="chatbox-outline"
    title="No reviews yet"
    message="Be the first to share your thoughts about this product!"
    {...props}
  />
);

export const EmptyProducts: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="cube-outline"
    title="No products available"
    message="There are no products in this category at the moment. Check back soon!"
    {...props}
  />
);

export const EmptyPromotions: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="pricetag-outline"
    title="No active promotions"
    message="There are currently no active promotions. Check back later for great deals!"
    {...props}
  />
);

export const NoConnection: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="cloud-offline-outline"
    title="No internet connection"
    message="Please check your internet connection and try again."
    {...props}
  />
);

export const ErrorState: React.FC<Omit<EmptyStateProps, 'icon' | 'title' | 'message'>> = (props) => (
  <EmptyState
    icon="alert-circle-outline"
    title="Something went wrong"
    message="We encountered an error while loading this content. Please try again."
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
    opacity: 0.6,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
    maxWidth: 300,
  },
  actionButton: {
    minWidth: 200,
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    minWidth: 200,
  },
});

export default EmptyState;
