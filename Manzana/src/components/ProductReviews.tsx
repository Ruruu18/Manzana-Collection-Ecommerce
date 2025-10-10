import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewsService, Review, ProductRatingStats } from '../services/reviews';
import { useAuth } from '../hooks/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { formatRelativeTime } from '../utils';
import Button from './Button';

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<ProductRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
    loadRatingStats();
    if (user) {
      checkCanReview();
    }
  }, [productId, user]);

  const loadReviews = async () => {
    const { data } = await reviewsService.getProductReviews(productId, 10);
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

  const checkCanReview = async () => {
    if (!user) return;
    const { canReview: can, hasPurchased: purchased } = await reviewsService.canUserReview(
      user.id,
      productId
    );
    setCanReview(can);
    setHasPurchased(purchased);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to leave a review');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Review Required', 'Please write a review comment');
      return;
    }

    setSubmitting(true);

    const { data, error } = await reviewsService.addReview(
      user.id,
      productId,
      rating,
      title.trim() || undefined,
      comment.trim(),
      hasPurchased
    );

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    // Add new review to list
    if (data) {
      setReviews([data, ...reviews]);
      setShowReviewModal(false);
      setRating(5);
      setTitle('');
      setComment('');
      setCanReview(false);
      loadRatingStats();
      Alert.alert('Success', 'Your review has been posted!');
    }
  };

  const renderRatingStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? COLORS.warning : COLORS.border}
          />
        ))}
      </View>
    );
  };

  const renderRatingStats = () => {
    if (!ratingStats) return null;

    return (
      <View style={styles.ratingStatsContainer}>
        <View style={styles.averageRating}>
          <Text style={styles.averageRatingNumber}>
            {ratingStats.average_rating.toFixed(1)}
          </Text>
          {renderRatingStars(Math.round(ratingStats.average_rating), 20)}
          <Text style={styles.totalReviews}>
            Based on {ratingStats.total_reviews} review{ratingStats.total_reviews !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingStats.rating_distribution[stars as keyof typeof ratingStats.rating_distribution];
            const percentage = ratingStats.total_reviews > 0
              ? (count / ratingStats.total_reviews) * 100
              : 0;

            return (
              <View key={stars} style={styles.distributionRow}>
                <Text style={styles.distributionStars}>{stars}</Text>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.distributionCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={COLORS.textSecondary} />
          </View>
          <View>
            <Text style={styles.reviewerName}>
              {item.user?.full_name || 'Anonymous'}
            </Text>
            <Text style={styles.reviewDate}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>
        {renderRatingStars(item.rating)}
      </View>

      {item.verified_purchase && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.verifiedText}>Verified Purchase</Text>
        </View>
      )}

      {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}

      {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}

      <View style={styles.reviewFooter}>
        <Text style={styles.helpfulText}>
          Helpful? {item.helpful_count > 0 && `(${item.helpful_count})`}
        </Text>
        <TouchableOpacity
          onPress={() => reviewsService.markReviewHelpful(item.id)}
        >
          <Ionicons name="thumbs-up-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingSelector}>
            <Text style={styles.label}>Your Rating</Text>
            <View style={styles.starsSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? COLORS.warning : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Summarize your review"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Review *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your experience with this product"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          <Button
            title="Submit Review"
            onPress={handleSubmitReview}
            loading={submitting}
            disabled={!comment.trim()}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {canReview && (
          <TouchableOpacity onPress={() => setShowReviewModal(true)}>
            <Text style={styles.writeReviewButton}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderRatingStats()}

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No reviews yet</Text>
            {canReview && (
              <Button
                title="Be the first to review"
                onPress={() => setShowReviewModal(true)}
                size="small"
                variant="outline"
                style={styles.firstReviewButton}
              />
            )}
          </View>
        }
      />

      {renderReviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
  },
  writeReviewButton: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  ratingStatsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  averageRating: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  averageRatingNumber: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  totalReviews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  ratingDistribution: {
    gap: SPACING.xs,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  distributionStars: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },
  distributionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
  },
  reviewDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  verifiedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
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
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  helpfulText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  firstReviewButton: {
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  ratingSelector: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  starsSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});

export default ProductReviews;
