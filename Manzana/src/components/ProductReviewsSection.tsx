import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { reviewsService, Review, ProductRatingStats } from '../services/reviews';
import { formatDate } from '../utils';

interface ProductReviewsSectionProps {
  productId: string;
  limit?: number;
}

const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  limit = 5,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<ProductRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadReviews();
    loadRatingStats();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    const { data } = await reviewsService.getProductReviews(productId, limit);
    if (data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const loadRatingStats = async () => {
    const { data } = await reviewsService.getProductRatingStats(productId);
    if (data) {
      setRatingStats(data);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? COLORS.warning : COLORS.border}
            style={{ marginHorizontal: 1 }}
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{rating}</Text>
        <Ionicons name="star" size={14} color={COLORS.warning} />
        <View style={styles.ratingBar}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.reviewerName}>{item.user?.full_name || 'Anonymous'}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
        {renderStars(item.rating)}
      </View>

      {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}

      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (!ratingStats || ratingStats.total_reviews === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        <View style={styles.noReviewsContainer}>
          <Ionicons name="chatbox-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtext}>
            Be the first to review this product!
          </Text>
        </View>
      </View>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer Reviews</Text>

      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.ratingOverview}>
          <Text style={styles.averageRating}>
            {ratingStats.average_rating.toFixed(1)}
          </Text>
          {renderStars(Math.round(ratingStats.average_rating), 20)}
          <Text style={styles.totalReviews}>
            Based on {ratingStats.total_reviews} {ratingStats.total_reviews === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={rating}>
              {renderRatingBar(
                rating,
                ratingStats.rating_distribution[rating as keyof typeof ratingStats.rating_distribution],
                ratingStats.total_reviews
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {displayedReviews.map((review) => (
          <View key={review.id}>
            {renderReviewItem({ item: review })}
          </View>
        ))}
      </View>

      {/* Show More Button */}
      {reviews.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
  },
  noReviewsText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  noReviewsSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  ratingSummary: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  ratingOverview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl + SPACING.sm,
    paddingBottom: SPACING.xl,
    marginRight: SPACING.md,
    overflow: 'visible',
  },
  averageRating: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    fontSize: 48,
    lineHeight: 56,
  },
  totalReviews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  ratingDistribution: {
    flex: 1.5,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ratingBarLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    width: 12,
    marginRight: SPACING.xs,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginHorizontal: SPACING.xs,
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },
  ratingBarCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginVertical: SPACING.xs,
    overflow: 'visible',
  },
  reviewsList: {
    marginTop: SPACING.md,
  },
  reviewItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  reviewerName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  reviewDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  verifiedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  reviewTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  reviewComment: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  helpfulContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  helpfulText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
  },
  showMoreText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
});

export default ProductReviewsSection;
