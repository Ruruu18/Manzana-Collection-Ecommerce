import { supabase } from './supabase';
import { Product } from '../types';

export const recommendationsService = {
  /**
   * Get personalized recommendations based on user's purchase history
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    try {
      // Get user's purchase history
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          orders!inner (
            user_id,
            status
          )
        `)
        .eq('orders.user_id', userId)
        .in('orders.status', ['delivered', 'completed']);

      if (!orderItems || orderItems.length === 0) {
        // If no purchase history, return trending products
        return this.getTrendingProducts(limit);
      }

      // Get categories from purchased products
      const purchasedProductIds = orderItems.map(item => item.product_id);

      const { data: purchasedProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', purchasedProductIds);

      const categoryIds = [...new Set(purchasedProducts?.map(p => p.category_id) || [])];

      // Get recommendations from same categories
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `)
        .in('category_id', categoryIds)
        .not('id', 'in', `(${purchasedProductIds.join(',')})`)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data as Product[], error: null };
    } catch (error: any) {
      console.error('Get personalized recommendations error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get "Frequently Bought Together" recommendations
   */
  async getFrequentlyBoughtTogether(productId: string, limit: number = 4) {
    try {
      // Get orders that contain this product
      const { data: ordersWithProduct } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', productId);

      if (!ordersWithProduct || ordersWithProduct.length === 0) {
        return this.getSimilarProducts(productId, limit);
      }

      const orderIds = ordersWithProduct.map(item => item.order_id);

      // Get other products from those orders
      const { data: relatedItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products (
            *,
            category:categories(id, name),
            images:product_images(id, url, alt_text, is_primary)
          )
        `)
        .in('order_id', orderIds)
        .neq('product_id', productId);

      if (!relatedItems) {
        return { data: [], error: null };
      }

      // Count frequency of each product
      const productFrequency: { [key: string]: { count: number; product: any } } = {};

      relatedItems.forEach(item => {
        if (item.products) {
          const id = item.product_id;
          if (!productFrequency[id]) {
            productFrequency[id] = { count: 0, product: item.products };
          }
          productFrequency[id].count++;
        }
      });

      // Sort by frequency and get top items
      const recommendations = Object.values(productFrequency)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.product)
        .filter(product => product.is_active && product.stock_quantity > 0);

      return { data: recommendations as Product[], error: null };
    } catch (error: any) {
      console.error('Get frequently bought together error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get similar products based on category and tags
   */
  async getSimilarProducts(productId: string, limit: number = 6) {
    try {
      // Get the source product
      const { data: sourceProduct } = await supabase
        .from('products')
        .select('category_id, tags, price')
        .eq('id', productId)
        .single();

      if (!sourceProduct) {
        return { data: [], error: 'Product not found' };
      }

      // Get similar products from same category
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `)
        .eq('category_id', sourceProduct.category_id)
        .neq('id', productId)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data as Product[], error: null };
    } catch (error: any) {
      console.error('Get similar products error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get trending products (most ordered in last 30 days)
   */
  async getTrendingProducts(limit: number = 10) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get order items from last 30 days
      const { data: recentOrders } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          orders!inner (
            created_at,
            status
          )
        `)
        .gte('orders.created_at', thirtyDaysAgo.toISOString())
        .in('orders.status', ['delivered', 'completed', 'shipped', 'processing']);

      if (!recentOrders || recentOrders.length === 0) {
        // Fallback to newest products
        return this.getNewArrivals(limit);
      }

      // Count product frequency
      const productCounts: { [key: string]: number } = {};
      recentOrders.forEach(item => {
        productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.quantity;
      });

      // Sort by count and get top product IDs
      const trendingProductIds = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      // Get full product details
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `)
        .in('id', trendingProductIds)
        .eq('is_active', true)
        .gt('stock_quantity', 0);

      if (error) throw error;

      // Sort by trending order
      const sortedData = trendingProductIds
        .map(id => data?.find(p => p.id === id))
        .filter(Boolean) as Product[];

      return { data: sortedData, error: null };
    } catch (error: any) {
      console.error('Get trending products error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data as Product[], error: null };
    } catch (error: any) {
      console.error('Get new arrivals error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get products based on user's wishlist
   */
  async getWishlistBasedRecommendations(userId: string, limit: number = 8) {
    try {
      // Get user's wishlist
      const { data: wishlistItems } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId);

      if (!wishlistItems || wishlistItems.length === 0) {
        return this.getTrendingProducts(limit);
      }

      const wishlistProductIds = wishlistItems.map(item => item.product_id);

      // Get categories from wishlist products
      const { data: wishlistProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', wishlistProductIds);

      const categoryIds = [...new Set(wishlistProducts?.map(p => p.category_id) || [])];

      // Get recommendations from same categories
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary)
        `)
        .in('category_id', categoryIds)
        .not('id', 'in', `(${wishlistProductIds.join(',')})`)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data as Product[], error: null };
    } catch (error: any) {
      console.error('Get wishlist-based recommendations error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get "You May Also Like" recommendations
   */
  async getYouMayAlsoLike(userId: string, currentProductId: string, limit: number = 6) {
    try {
      // Combine multiple recommendation strategies
      const [similar, frequentlyBought, personalized] = await Promise.all([
        this.getSimilarProducts(currentProductId, 3),
        this.getFrequentlyBoughtTogether(currentProductId, 2),
        this.getPersonalizedRecommendations(userId, 2),
      ]);

      // Combine and deduplicate
      const allRecommendations = [
        ...(similar.data || []),
        ...(frequentlyBought.data || []),
        ...(personalized.data || []),
      ];

      const uniqueRecommendations = allRecommendations.filter(
        (product, index, self) =>
          index === self.findIndex(p => p.id === product.id) &&
          product.id !== currentProductId
      ).slice(0, limit);

      return { data: uniqueRecommendations, error: null };
    } catch (error: any) {
      console.error('Get you may also like error:', error);
      return { data: null, error: error.message };
    }
  },
};
