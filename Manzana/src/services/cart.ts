import { supabase } from './supabase';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_ids?: string[]; // Array of variant IDs
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: any;
  product_variants?: any[]; // Array of variant objects
}

export const cartService = {
  /**
   * Add item to cart or update quantity if exists
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
    variantIds?: string[]
  ) {
    try {
      // First, check product stock availability
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (!product || product.stock_quantity === 0) {
        return { data: null, error: 'Product is out of stock' };
      }

      // Check if item already in cart with same variant combination
      const { data: cartItems, error: checkError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Find existing item with same variant combination
      const sortedVariantIds = variantIds?.sort() || [];
      const existing = cartItems?.find(item => {
        const itemVariantIds = (item.variant_ids || []).sort();
        return JSON.stringify(itemVariantIds) === JSON.stringify(sortedVariantIds);
      });

      if (existing) {
        // Check if new quantity exceeds stock
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          return {
            data: null,
            error: `Only ${product.stock_quantity} items available. You already have ${existing.quantity} in cart.`
          };
        }

        // Update quantity
        const { data, error } = await supabase
          .from('cart')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } else {
        // Check if requested quantity exceeds stock
        if (quantity > product.stock_quantity) {
          return {
            data: null,
            error: `Only ${product.stock_quantity} items available`
          };
        }
        // Add new item
        const insertData: any = {
          user_id: userId,
          product_id: productId,
          quantity,
          variant_ids: sortedVariantIds,
        };

        const { data, error } = await supabase
          .from('cart')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }
    } catch (error: any) {
      console.error('❌ Add to cart error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Get user's cart with product details
   */
  async getCart(userId: string) {
    try {
      // First get cart items with products
      const { data: cartData, error } = await supabase
        .from('cart')
        .select(`
          *,
          products (
            id,
            name,
            price,
            discounted_price,
            stock_quantity,
            is_active,
            product_images (
              id,
              url,
              alt_text,
              is_primary
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Manually fetch variants for items that have variant_ids
      const cartWithVariants = await Promise.all(
        (cartData || []).map(async (item: any) => {
          let variants: any[] = [];

          if (item.variant_ids && item.variant_ids.length > 0) {
            const { data: variantData } = await supabase
              .from('product_variants')
              .select('id, name, type, value, price_adjustment, stock_quantity')
              .in('id', item.variant_ids);

            variants = variantData || [];
          }

          return {
            ...item,
            product_variants: variants,
            product: item.products
              ? {
                  ...item.products,
                  images: (item.products.product_images || []).sort(
                    (a: any, b: any) => {
                      if (a.is_primary && !b.is_primary) return -1;
                      if (!a.is_primary && b.is_primary) return 1;
                      return 0;
                    }
                  ),
                }
              : null,
          };
        })
      );

      return { data: cartWithVariants, error: null };
    } catch (error: any) {
      console.error('❌ Get cart error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Update cart item quantity
   */
  async updateQuantity(cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        return this.removeItem(cartItemId);
      }

      // Get cart item to check product stock
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .select('product_id')
        .eq('id', cartItemId)
        .single();

      if (cartError) throw cartError;

      // Check product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', cartItem.product_id)
        .single();

      if (productError) throw productError;

      // Validate quantity against stock
      if (quantity > product.stock_quantity) {
        return {
          data: null,
          error: `Only ${product.stock_quantity} items available`
        };
      }

      const { data, error } = await supabase
        .from('cart')
        .update({
          quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartItemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Update quantity error:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Remove item from cart
   */
  async removeItem(cartItemId: string) {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('❌ Remove item error:', error);
      return { error: error.message };
    }
  },

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('❌ Clear cart error:', error);
      return { error: error.message };
    }
  },

  /**
   * Get cart count
   */
  async getCartCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error: any) {
      console.error('❌ Get cart count error:', error);
      return { count: 0, error: error.message };
    }
  },

  /**
   * Update cart item variants
   */
  async updateVariants(cartItemId: string, variantIds: string[]) {
    try {
      const sortedVariantIds = variantIds.sort();

      const { data, error } = await supabase
        .from('cart')
        .update({
          variant_ids: sortedVariantIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartItemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Update variants error:', error);
      return { data: null, error: error.message };
    }
  },
};
