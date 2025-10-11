import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { reviewsService } from '../services/reviews';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  userId: string;
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  productId,
  productName,
  productImage,
  userId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Review Required', 'Please write a review before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await reviewsService.addReview(
        userId,
        productId,
        rating,
        title.trim() || undefined,
        comment.trim()
      );

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      Alert.alert('Success', 'Your review has been submitted. Thank you!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setRating(0);
            setTitle('');
            setComment('');
            onReviewSubmitted?.();
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (rating > 0 || title.trim() || comment.trim()) {
      Alert.alert(
        'Discard Review?',
        'Are you sure you want to discard your review?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setTitle('');
              setComment('');
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Write a Review</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Info */}
            <View style={styles.productInfo}>
              {productImage ? (
                <Image
                  source={{ uri: productImage }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={2}>
                  {productName}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.label}>Rating *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    disabled={submitting}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? COLORS.warning : COLORS.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Review Title (Optional)</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Summarize your experience"
                placeholderTextColor={COLORS.textSecondary}
                maxLength={100}
                editable={!submitting}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Review *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={comment}
                onChangeText={setComment}
                placeholder="Share your thoughts about this product..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                editable={!submitting}
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (rating === 0 || !comment.trim() || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || !comment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: '70%',
  },
  productInfo: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  productName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  section: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default ReviewModal;
