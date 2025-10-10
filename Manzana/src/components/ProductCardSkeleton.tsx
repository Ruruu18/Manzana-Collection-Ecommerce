import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface ProductCardSkeletonProps {
  width?: number;
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ width = 160 }) => {
  return (
    <View style={[styles.container, { width }]}>
      {/* Image skeleton */}
      <SkeletonLoader width={width} height={width} borderRadius={BORDER_RADIUS.md} />

      {/* Title skeleton */}
      <View style={styles.content}>
        <SkeletonLoader width="80%" height={16} style={{ marginBottom: SPACING.xs }} />
        <SkeletonLoader width="60%" height={14} />

        {/* Price skeleton */}
        <View style={styles.priceContainer}>
          <SkeletonLoader width={60} height={18} />
        </View>
      </View>
    </View>
  );
};

export default ProductCardSkeleton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  content: {
    padding: SPACING.sm,
  },
  priceContainer: {
    marginTop: SPACING.sm,
  },
});
