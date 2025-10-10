import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface ListSkeletonProps {
  count?: number;
  itemHeight?: number;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  itemHeight = 80,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.item, { height: itemHeight }]}>
          <SkeletonLoader
            width={60}
            height={60}
            borderRadius={BORDER_RADIUS.md}
            style={styles.itemImage}
          />
          <View style={styles.itemContent}>
            <SkeletonLoader width="70%" height={16} style={{ marginBottom: SPACING.xs }} />
            <SkeletonLoader width="50%" height={14} style={{ marginBottom: SPACING.xs }} />
            <SkeletonLoader width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ListSkeleton;

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  itemImage: {
    marginRight: SPACING.md,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
