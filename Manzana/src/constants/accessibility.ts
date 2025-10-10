/**
 * Accessibility constants for Manzana Collection
 * Following WCAG 2.1 Level AA standards
 * https://www.w3.org/WAI/WCAG21/quickref/
 */

export const A11Y_LABELS = {
  // Navigation
  BACK_BUTTON: 'Go back',
  HOME_TAB: 'Home',
  CATALOG_TAB: 'Catalog',
  PROMOTIONS_TAB: 'Promotions',
  NOTIFICATIONS_TAB: 'Notifications',
  PROFILE_TAB: 'Profile',

  // Cart
  ADD_TO_CART: 'Add to cart',
  VIEW_CART: 'View shopping cart',
  REMOVE_FROM_CART: 'Remove from cart',
  INCREASE_QUANTITY: 'Increase quantity',
  DECREASE_QUANTITY: 'Decrease quantity',
  CHECKOUT: 'Proceed to checkout',
  CART_BADGE: (count: number) => `${count} item${count !== 1 ? 's' : ''} in cart`,

  // Wishlist
  ADD_TO_WISHLIST: 'Add to wishlist',
  REMOVE_FROM_WISHLIST: 'Remove from wishlist',
  VIEW_WISHLIST: 'View wishlist',

  // Product
  PRODUCT_IMAGE: 'Product image',
  PRODUCT_DETAILS: 'View product details',
  PRODUCT_CARD: (name: string, price: string) => `${name}, ${price}`,

  // Profile
  EDIT_PROFILE: 'Edit profile',
  SIGN_OUT: 'Sign out',
  SETTINGS: 'Settings',
  AVATAR: (name: string) => `${name}'s avatar`,

  // Common
  CLOSE: 'Close',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  SEARCH: 'Search',
  FILTER: 'Filter',
  SORT: 'Sort',
  REFRESH: 'Refresh',
  MENU: 'Menu',
  MORE: 'More options',
};

export const A11Y_HINTS = {
  // Cart
  ADD_TO_CART: 'Double tap to add this item to your shopping cart',
  REMOVE_FROM_CART: 'Double tap to remove this item from your cart',
  INCREASE_QUANTITY: (current: number) =>
    `Current quantity is ${current}. Double tap to increase by one.`,
  DECREASE_QUANTITY: (current: number) =>
    `Current quantity is ${current}. Double tap to decrease by one.`,
  CHECKOUT: (items: number, total: string) =>
    `Double tap to checkout ${items} item${items !== 1 ? 's' : ''} for ${total}`,

  // Wishlist
  ADD_TO_WISHLIST: 'Double tap to add this item to your wishlist',
  REMOVE_FROM_WISHLIST: 'Double tap to remove this item from your wishlist',

  // Product
  VIEW_DETAILS: 'Double tap to view full product details',
  VIEW_IMAGE: 'Double tap to view larger image',

  // Navigation
  GO_BACK: 'Double tap to go back to the previous screen',
  NAVIGATE_TO: (destination: string) => `Double tap to go to ${destination}`,

  // Common
  EDIT: 'Double tap to edit',
  DELETE: 'Double tap to delete',
  SAVE: 'Double tap to save changes',
  CANCEL: 'Double tap to cancel',
};

export const A11Y_ROLES = {
  BUTTON: 'button' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  HEADER: 'header' as const,
  LINK: 'link' as const,
  SEARCH: 'search' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  SWITCH: 'switch' as const,
  TAB: 'tab' as const,
  ADJUSTABLE: 'adjustable' as const,
  IMAGEBUTTON: 'imagebutton' as const,
  SUMMARY: 'summary' as const,
  NONE: 'none' as const,
};

/**
 * Helper to combine accessibility props
 */
export const getA11yProps = (
  label: string,
  hint?: string,
  role?: keyof typeof A11Y_ROLES
) => ({
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: role ? A11Y_ROLES[role] : undefined,
});

/**
 * Helper for button accessibility
 */
export const getButtonA11y = (label: string, hint?: string) => ({
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: A11Y_ROLES.BUTTON,
});

/**
 * Helper for image accessibility
 */
export const getImageA11y = (description: string) => ({
  accessibilityLabel: description,
  accessibilityRole: A11Y_ROLES.IMAGE,
});
