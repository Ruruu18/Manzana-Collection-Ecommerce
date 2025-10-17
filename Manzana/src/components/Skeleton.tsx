import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.sm,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface ProductCardSkeletonProps {
  style?: ViewStyle;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.productCard, style]}>
      <Skeleton width="100%" height={180} borderRadius={BORDER_RADIUS.md} />
      <View style={styles.productContent}>
        <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={18} />
      </View>
    </View>
  );
};

interface OrderCardSkeletonProps {
  style?: ViewStyle;
}

export const OrderCardSkeleton: React.FC<OrderCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.orderCard, style]}>
      <View style={styles.orderHeader}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={1} style={{ marginVertical: 12 }} />
      <View style={styles.orderDetails}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} />
      </View>
    </View>
  );
};

interface ReviewCardSkeletonProps {
  style?: ViewStyle;
}

export const ReviewCardSkeleton: React.FC<ReviewCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.reviewCard, style]}>
      <View style={styles.reviewHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="40%" height={14} style={{ marginBottom: 4 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={60} style={{ marginTop: 12 }} />
    </View>
  );
};

interface ListSkeletonProps {
  count?: number;
  type?: 'product' | 'order' | 'review' | 'default';
  style?: ViewStyle;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  type = 'default',
  style,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return <ProductCardSkeleton />;
      case 'order':
        return <OrderCardSkeleton />;
      case 'review':
        return <ReviewCardSkeleton />;
      default:
        return (
          <View style={styles.defaultCard}>
            <Skeleton width="100%" height={80} />
          </View>
        );
    }
  };

  return (
    <View style={[styles.listContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: SPACING.md }}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productContent: {
    padding: SPACING.sm,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetails: {
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    padding: SPACING.lg,
  },
});

export default Skeleton;
