import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Promotion } from '../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import {
  getPromotionBadgeText,
  getPromotionTimeRemaining,
  isPromotionEndingSoon,
} from '../utils/promotionUtils';

interface PromotionBadgeProps {
  promotion: Promotion;
  showCountdown?: boolean;
  style?: any;
}

const PromotionBadge: React.FC<PromotionBadgeProps> = ({
  promotion,
  showCountdown = false,
  style,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(
    getPromotionTimeRemaining(promotion.end_date)
  );

  useEffect(() => {
    if (!showCountdown) return;

    const interval = setInterval(() => {
      const remaining = getPromotionTimeRemaining(promotion.end_date);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [promotion.end_date, showCountdown]);

  if (timeRemaining.isExpired) return null;

  const badgeText = getPromotionBadgeText(promotion);
  const endingSoon = isPromotionEndingSoon(promotion.end_date);

  return (
    <View style={[styles.container, style]}>
      {/* Promotion Badge */}
      <View
        style={[
          styles.badge,
          endingSoon && styles.badgeUrgent,
        ]}
      >
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>

      {/* Countdown Timer */}
      {showCountdown && (
        <View
          style={[
            styles.countdown,
            endingSoon && styles.countdownUrgent,
          ]}
        >
          <Text
            style={[
              styles.countdownText,
              endingSoon && styles.countdownTextUrgent,
            ]}
          >
            {timeRemaining.formatted}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeUrgent: {
    backgroundColor: '#FF3B30', // Red for urgency
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  countdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  countdownUrgent: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  countdownText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  countdownTextUrgent: {
    fontWeight: 'bold',
  },
});

export default PromotionBadge;
