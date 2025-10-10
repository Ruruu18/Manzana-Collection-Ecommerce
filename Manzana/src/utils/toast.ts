import { showMessage } from 'react-native-flash-message';
import { COLORS } from '../constants/theme';

export const toast = {
  success: (message: string, description?: string) => {
    showMessage({
      message,
      description,
      type: 'success',
      icon: 'success',
      backgroundColor: COLORS.success,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    showMessage({
      message,
      description,
      type: 'danger',
      icon: 'danger',
      backgroundColor: COLORS.error,
      duration: 4000,
    });
  },

  info: (message: string, description?: string) => {
    showMessage({
      message,
      description,
      type: 'info',
      icon: 'info',
      backgroundColor: COLORS.primary,
      duration: 3000,
    });
  },

  warning: (message: string, description?: string) => {
    showMessage({
      message,
      description,
      type: 'warning',
      icon: 'warning',
      backgroundColor: COLORS.warning,
      duration: 3000,
    });
  },

  // Specialized toasts for common actions
  addedToCart: (productName?: string) => {
    showMessage({
      message: 'Added to Cart',
      description: productName ? `${productName} added to your cart` : undefined,
      type: 'success',
      icon: 'success',
      backgroundColor: COLORS.success,
      duration: 2500,
    });
  },

  removedFromCart: (productName?: string) => {
    showMessage({
      message: 'Removed from Cart',
      description: productName ? `${productName} removed` : undefined,
      type: 'info',
      icon: 'info',
      backgroundColor: COLORS.textSecondary,
      duration: 2500,
    });
  },

  addedToWishlist: (productName?: string) => {
    showMessage({
      message: 'Added to Wishlist',
      description: productName ? `${productName} saved to wishlist` : undefined,
      type: 'success',
      icon: { icon: 'auto', position: 'left' },
      backgroundColor: COLORS.error, // Using pink/red for wishlist
      duration: 2500,
    });
  },

  removedFromWishlist: (productName?: string) => {
    showMessage({
      message: 'Removed from Wishlist',
      description: productName,
      type: 'info',
      icon: 'info',
      backgroundColor: COLORS.textSecondary,
      duration: 2500,
    });
  },

  orderPlaced: (orderNumber?: string) => {
    showMessage({
      message: 'Order Placed Successfully! 🎉',
      description: orderNumber ? `Order #${orderNumber}` : 'Your order has been confirmed',
      type: 'success',
      icon: 'success',
      backgroundColor: COLORS.success,
      duration: 4000,
    });
  },

  quantityUpdated: () => {
    showMessage({
      message: 'Quantity Updated',
      type: 'info',
      icon: 'info',
      backgroundColor: COLORS.primary,
      duration: 2000,
    });
  },
};
