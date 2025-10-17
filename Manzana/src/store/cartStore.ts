import { create } from 'zustand';
import { cartService, CartItem } from '../services/cart';

interface CartState {
  cart: CartItem[];
  cartCount: number;
  loading: boolean;

  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCart: (cart: CartItem[]) => void;
  setCartCount: (count: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;

  // Async actions with database sync
  loadCart: (userId: string) => Promise<void>;
  addToCartAsync: (userId: string, productId: string, quantity: number, variantIds?: string[]) => Promise<{ error?: string }>;
  updateQuantityAsync: (cartItemId: string, quantity: number) => Promise<{ error?: string }>;
  updateVariantsAsync: (cartItemId: string, variantIds: string[]) => Promise<{ error?: string }>;
  removeFromCartAsync: (cartItemId: string) => Promise<{ error?: string }>;
  clearCartAsync: (userId: string) => Promise<{ error?: string }>;
}

/**
 * Zustand store for shopping cart state
 * Manages cart items and count across the app with database sync
 */
export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  cartCount: 0,
  loading: false,

  // Optimistic local updates
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
          cartCount: state.cartCount + item.quantity,
        };
      }
      return {
        cart: [...state.cart, item],
        cartCount: state.cartCount + item.quantity,
      };
    }),

  removeFromCart: (itemId) =>
    set((state) => {
      const item = state.cart.find((i) => i.id === itemId);
      return {
        cart: state.cart.filter((i) => i.id !== itemId),
        cartCount: state.cartCount - (item?.quantity || 0),
      };
    }),

  updateQuantity: (itemId, quantity) =>
    set((state) => {
      const item = state.cart.find((i) => i.id === itemId);
      const oldQuantity = item?.quantity || 0;
      const diff = quantity - oldQuantity;

      if (quantity <= 0) {
        // Remove if quantity is 0
        return {
          cart: state.cart.filter((i) => i.id !== itemId),
          cartCount: state.cartCount - oldQuantity,
        };
      }

      return {
        cart: state.cart.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        ),
        cartCount: state.cartCount + diff,
      };
    }),

  setCart: (cart) =>
    set({
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    }),

  setCartCount: (count) => set({ cartCount: count }),

  clearCart: () => set({ cart: [], cartCount: 0 }),

  setLoading: (loading) => set({ loading }),

  // Load cart from database
  loadCart: async (userId: string) => {
    try {
      set({ loading: true });
      const { data, error } = await cartService.getCart(userId);

      if (error) {
        console.error('Error loading cart:', error);
        return;
      }

      set({
        cart: data || [],
        cartCount: (data || []).reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (error) {
      console.error('Cart load error:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Add to cart with database sync
  addToCartAsync: async (userId: string, productId: string, quantity: number, variantIds?: string[]) => {
    try {
      const { data, error } = await cartService.addToCart(userId, productId, quantity, variantIds);

      if (error) {
        return { error };
      }

      if (data) {
        // Update store with database response
        const state = get();
        const existingItem = state.cart.find((i) => i.id === data.id);

        if (existingItem) {
          set({
            cart: state.cart.map((i) => (i.id === data.id ? data : i)),
            cartCount: state.cart.reduce((sum, item) =>
              sum + (item.id === data.id ? data.quantity : item.quantity), 0
            ),
          });
        } else {
          set({
            cart: [...state.cart, data],
            cartCount: state.cartCount + quantity,
          });
        }
      }

      return {};
    } catch (error: any) {
      console.error('Add to cart error:', error);
      return { error: error.message || 'Failed to add to cart' };
    }
  },

  // Update quantity with database sync
  updateQuantityAsync: async (cartItemId: string, quantity: number) => {
    try {
      // Optimistic update
      const state = get();
      const oldItem = state.cart.find((i) => i.id === cartItemId);
      get().updateQuantity(cartItemId, quantity);

      // Database sync
      const { error } = await cartService.updateQuantity(cartItemId, quantity);

      if (error) {
        // Rollback on error
        if (oldItem) {
          get().updateQuantity(cartItemId, oldItem.quantity);
        }
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Update quantity error:', error);
      return { error: error.message || 'Failed to update quantity' };
    }
  },

  // Update variants with database sync
  updateVariantsAsync: async (cartItemId: string, variantIds: string[]) => {
    try {
      // Database sync
      const { error } = await cartService.updateVariants(cartItemId, variantIds);

      if (error) {
        return { error };
      }

      // Reload cart to get updated variant data
      const userId = get().cart.find((i) => i.id === cartItemId)?.user_id;
      if (userId) {
        await get().loadCart(userId);
      }

      return {};
    } catch (error: any) {
      console.error('Update variants error:', error);
      return { error: error.message || 'Failed to update variants' };
    }
  },

  // Remove from cart with database sync
  removeFromCartAsync: async (cartItemId: string) => {
    try {
      // Optimistic update
      const state = get();
      const oldItem = state.cart.find((i) => i.id === cartItemId);
      get().removeFromCart(cartItemId);

      // Database sync
      const { error } = await cartService.removeItem(cartItemId);

      if (error) {
        // Rollback on error
        if (oldItem) {
          get().addToCart(oldItem);
        }
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Remove item error:', error);
      return { error: error.message || 'Failed to remove item' };
    }
  },

  // Clear cart with database sync
  clearCartAsync: async (userId: string) => {
    try {
      // Optimistic update
      const oldCart = get().cart;
      get().clearCart();

      // Database sync
      const { error } = await cartService.clearCart(userId);

      if (error) {
        // Rollback on error
        get().setCart(oldCart);
        return { error };
      }

      return {};
    } catch (error: any) {
      console.error('Clear cart error:', error);
      return { error: error.message || 'Failed to clear cart' };
    }
  },
}));
