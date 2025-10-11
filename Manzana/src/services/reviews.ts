import { supabase } from './supabase';

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface ProductRatingStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const reviewsService = {
  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string, limit: number = 10, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users (
            id,
            full_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data: data as Review[], error: null };
    } catch (error: any) {
      console.error('Get reviews error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get product rating statistics
   */
  async getProductRatingStats(productId: string): Promise<{ data: ProductRatingStats | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          data: {
            average_rating: 0,
            total_reviews: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
          error: null,
        };
      }

      const totalReviews = data.length;
      const sumRatings = data.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = sumRatings / totalReviews;

      const distribution = data.reduce((acc: any, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {});

      return {
        data: {
          average_rating: averageRating,
          total_reviews: totalReviews,
          rating_distribution: {
            5: distribution[5] || 0,
            4: distribution[4] || 0,
            3: distribution[3] || 0,
            2: distribution[2] || 0,
            1: distribution[1] || 0,
          },
        },
        error: null,
      };
    } catch (error: any) {
      console.error('Get rating stats error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Add a review
   */
  async addReview(
    userId: string,
    productId: string,
    rating: number,
    title?: string,
    comment?: string
  ) {
    try {
      // Check if user already reviewed this product
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        return { data: null, error: 'You have already reviewed this product' };
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          product_id: productId,
          rating,
          title,
          comment,
        })
        .select(`
          *,
          user:users (
            id,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      return { data: data as Review, error: null };
    } catch (error: any) {
      console.error('Add review error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    rating: number,
    title?: string,
    comment?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          title,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select(`
          *,
          user:users (
            id,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      return { data: data as Review, error: null };
    } catch (error: any) {
      console.error('Update review error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error('Delete review error:', error);
      return { error: error.message };
    }
  },

  /**
   * Mark review as helpful
   * Note: This function is disabled until helpful_count column is added to database
   */
  async markReviewHelpful(reviewId: string) {
    try {
      // TODO: Implement when helpful_count column is added to reviews table
      console.log('Mark helpful feature not yet implemented for review:', reviewId);
      return { error: 'Feature not yet implemented' };
    } catch (error: any) {
      console.error('Mark helpful error:', error);
      return { error: error.message };
    }
  },

  /**
   * Check if user can review product (has purchased it)
   */
  async canUserReview(userId: string, productId: string): Promise<{ canReview: boolean; hasPurchased: boolean }> {
    try {
      // Check if user has purchased this product
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            product_id
          )
        `)
        .eq('user_id', userId)
        .eq('order_items.product_id', productId)
        .in('status', ['delivered', 'completed']);

      const hasPurchased = (orders && orders.length > 0) || false;

      // Check if user already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      const canReview = !existingReview;

      return { canReview, hasPurchased };
    } catch (error: any) {
      console.error('Can user review error:', error);
      return { canReview: false, hasPurchased: false };
    }
  },

  /**
   * Get products from order that user can review
   */
  async getReviewableProductsFromOrder(userId: string, orderId: string) {
    try {
      // Get order items
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            name,
            product_images (url, is_primary)
          )
        `)
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      if (!orderItems || orderItems.length === 0) {
        return { data: [], error: null };
      }

      // Check which products have already been reviewed
      const productIds = orderItems.map(item => item.product_id);
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', productIds);

      const reviewedProductIds = new Set(existingReviews?.map(r => r.product_id) || []);

      // Filter out already reviewed products
      const reviewableProducts = orderItems
        .filter(item => !reviewedProductIds.has(item.product_id))
        .map(item => ({
          productId: item.product_id,
          productName: item.products?.name || 'Product',
          productImage: item.products?.product_images?.find((img: any) => img.is_primary)?.url ||
                       item.products?.product_images?.[0]?.url,
          quantity: item.quantity,
        }));

      return { data: reviewableProducts, error: null };
    } catch (error: any) {
      console.error('Get reviewable products error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Check if order has any reviewable products
   */
  async hasReviewableProducts(userId: string, orderId: string): Promise<boolean> {
    try {
      const { data } = await this.getReviewableProductsFromOrder(userId, orderId);
      return (data && data.length > 0) || false;
    } catch (error) {
      return false;
    }
  },
};
