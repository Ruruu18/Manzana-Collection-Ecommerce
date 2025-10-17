import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility utility functions for better a11y support
 */

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('Error checking screen reader status:', error);
    return false;
  }
};

/**
 * Announce message to screen reader
 */
export const announceForAccessibility = (message: string): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message);
  }
};

/**
 * Set accessibility focus to a component
 */
export const setAccessibilityFocus = (reactTag: number): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyForA11y = (amount: number): string => {
  return `${amount.toFixed(2)} pesos`;
};

/**
 * Format date for screen readers
 */
export const formatDateForA11y = (date: string): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format time for screen readers
 */
export const formatTimeForA11y = (time: string): string => {
  // Assumes time is in "HH:MM AM/PM" format
  return time.replace(':', ' ');
};

/**
 * Get rating accessibility label
 */
export const getRatingA11yLabel = (rating: number, maxRating: number = 5): string => {
  return `Rated ${rating} out of ${maxRating} stars`;
};

/**
 * Get stock status accessibility label
 */
export const getStockA11yLabel = (stock: number): string => {
  if (stock === 0) {
    return 'Out of stock';
  } else if (stock < 5) {
    return `Only ${stock} items left in stock`;
  } else {
    return 'In stock';
  }
};

/**
 * Get order status accessibility label
 */
export const getOrderStatusA11yLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Order is pending',
    confirmed: 'Order confirmed',
    processing: 'Order is being processed',
    ready: 'Order is ready for pickup',
    completed: 'Order completed',
    cancelled: 'Order cancelled',
  };
  return statusLabels[status] || status;
};

/**
 * Get variant accessibility label
 */
export const getVariantA11yLabel = (type: string, value: string): string => {
  return `${type}: ${value}`;
};

/**
 * Combine accessibility labels
 */
export const combineA11yLabels = (...labels: (string | undefined)[]): string => {
  return labels.filter(Boolean).join('. ');
};

/**
 * Get button action hint
 */
export const getButtonHint = (action: string): string => {
  return `Double tap to ${action}`;
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.error('Error checking reduce motion status:', error);
    return false;
  }
};

/**
 * Get product card accessibility label
 */
export const getProductCardA11yLabel = (
  name: string,
  price: number,
  rating?: number,
  stock?: number
): string => {
  const labels = [
    name,
    formatCurrencyForA11y(price),
  ];

  if (rating !== undefined) {
    labels.push(getRatingA11yLabel(rating));
  }

  if (stock !== undefined) {
    labels.push(getStockA11yLabel(stock));
  }

  return labels.join('. ');
};

/**
 * Get cart item accessibility label
 */
export const getCartItemA11yLabel = (
  name: string,
  quantity: number,
  price: number,
  variants?: Array<{ type: string; value: string }>
): string => {
  const labels = [
    name,
    `Quantity: ${quantity}`,
    `Price: ${formatCurrencyForA11y(price * quantity)}`,
  ];

  if (variants && variants.length > 0) {
    const variantLabels = variants.map(v => getVariantA11yLabel(v.type, v.value));
    labels.push(...variantLabels);
  }

  return labels.join('. ');
};

export default {
  isScreenReaderEnabled,
  announceForAccessibility,
  setAccessibilityFocus,
  formatCurrencyForA11y,
  formatDateForA11y,
  formatTimeForA11y,
  getRatingA11yLabel,
  getStockA11yLabel,
  getOrderStatusA11yLabel,
  getVariantA11yLabel,
  combineA11yLabels,
  getButtonHint,
  isReduceMotionEnabled,
  getProductCardA11yLabel,
  getCartItemA11yLabel,
};
