import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Promotion } from "../types";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../constants/theme";
import { optimizeImageUrl } from "../utils";

const { width: screenWidth } = Dimensions.get("window");
const COUNTDOWN_CARD_WIDTH = screenWidth - SPACING.lg * 2;

interface PromotionCountdownProps {
  promotion: Promotion;
  onPress: (promotion: Promotion) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const PromotionCountdown: React.FC<PromotionCountdownProps> = ({
  promotion,
  onPress,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const startTime = new Date(promotion.start_date).getTime();
      const difference = startTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [promotion.start_date]);

  const formatTimeUnit = (value: number): string => {
    return value.toString().padStart(2, "0");
  };

  const getCountdownLabel = (): string => {
    if (isExpired) return "Promotion Started!";
    if (timeRemaining.days === 1) return "1 Day to Go";
    if (timeRemaining.days > 1) return `${timeRemaining.days} Days to Go`;
    if (timeRemaining.hours > 0) return "Starting Soon";
    return "Starting Very Soon";
  };

  const getCountdownColor = (): string => {
    if (isExpired) return COLORS.success;
    if (timeRemaining.days === 1) return COLORS.warning;
    if (timeRemaining.days === 0) return COLORS.error;
    return COLORS.primary;
  };

  if (isExpired) {
    return null; // Don't show expired countdowns
  }

  const discountText = promotion.promotion_type === "percentage"
    ? `${promotion.discount_value}% OFF`
    : promotion.promotion_type === "fixed_amount"
    ? `₱${promotion.discount_value} OFF`
    : promotion.promotion_type === "free_shipping"
    ? "FREE SHIPPING"
    : "SPECIAL OFFER";

  return (
    <TouchableOpacity
      style={styles.countdownCard}
      onPress={() => onPress(promotion)}
      activeOpacity={0.9}
    >
      {/* Background Image - Full Card */}
      {promotion.image_url ? (
        <Image
          source={{ uri: optimizeImageUrl(promotion.image_url, COUNTDOWN_CARD_WIDTH, 160) }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundImage}
        />
      )}

      {/* Dark Overlay */}
      <View style={styles.overlay} />

      {/* Content - Clean Layout */}
      <View style={styles.content}>
        {/* Top Left - Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getCountdownColor() }]}>
          <Text style={styles.statusBadgeText}>{getCountdownLabel()}</Text>
        </View>

        {/* Title - Left Side */}
        <Text style={styles.promotionTitle} numberOfLines={2}>
          {promotion.title}
        </Text>

        {/* Bottom Row - Discount + Timer + Arrow */}
        <View style={styles.bottomRow}>
          {/* Left - Discount */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountText}</Text>
          </View>

          {/* Right - Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerGrid}>
              {timeRemaining.days > 0 && (
                <View style={styles.timeUnit}>
                  <Text style={styles.timeValue}>{formatTimeUnit(timeRemaining.days)}</Text>
                  <Text style={styles.timeLabel}>DAYS</Text>
                </View>
              )}
              <View style={styles.timeUnit}>
                <Text style={styles.timeValue}>{formatTimeUnit(timeRemaining.hours)}</Text>
                <Text style={styles.timeLabel}>HRS</Text>
              </View>
              <View style={styles.timeUnit}>
                <Text style={styles.timeValue}>{formatTimeUnit(timeRemaining.minutes)}</Text>
                <Text style={styles.timeLabel}>MIN</Text>
              </View>
              <View style={styles.timeUnit}>
                <Text style={styles.timeValue}>{formatTimeUnit(timeRemaining.seconds)}</Text>
                <Text style={styles.timeLabel}>SEC</Text>
              </View>
            </View>
          </View>

          {/* Arrow Button */}
          <View style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  countdownCard: {
    width: COUNTDOWN_CARD_WIDTH,
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    marginVertical: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: "space-between",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  promotionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: "bold",
    marginTop: SPACING.xs,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discountBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  discountText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timerContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: SPACING.sm,
  },
  timerGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeUnit: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 46,
    height: 48,
  },
  timeValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 9,
    lineHeight: 10,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
});

export default PromotionCountdown;