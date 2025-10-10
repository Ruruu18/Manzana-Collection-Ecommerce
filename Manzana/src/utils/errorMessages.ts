/**
 * Standardized error messages for better user experience
 */

export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK: {
    NO_CONNECTION: 'No internet connection. Please check your network settings and try again.',
    TIMEOUT: 'Request timed out. Please check your connection and try again.',
    SERVER_UNREACHABLE: 'Unable to reach the server. Please try again later.',
    SLOW_CONNECTION: 'Your connection seems slow. Please wait or try again.',
  },

  // Authentication Errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    EMAIL_NOT_CONFIRMED: 'Please verify your email address to continue.',
    USER_NOT_FOUND: 'No account found with this email.',
    ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    WEAK_PASSWORD: 'Password must be at least 8 characters long.',
    EMAIL_IN_USE: 'This email is already registered. Try signing in instead.',
    INVALID_EMAIL: 'Please enter a valid email address.',
  },

  // Database Errors
  DATABASE: {
    FETCH_FAILED: 'Failed to load data. Please try again.',
    UPDATE_FAILED: 'Failed to save changes. Please try again.',
    DELETE_FAILED: 'Failed to delete item. Please try again.',
    CREATE_FAILED: 'Failed to create item. Please try again.',
    NOT_FOUND: 'The requested item was not found.',
    DUPLICATE_ENTRY: 'This item already exists.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
  },

  // Product Errors
  PRODUCT: {
    NOT_FOUND: 'Product not found or no longer available.',
    OUT_OF_STOCK: 'This product is currently out of stock.',
    INSUFFICIENT_STOCK: 'Not enough items in stock for your requested quantity.',
    LOAD_FAILED: 'Failed to load products. Please try again.',
  },

  // Cart & Order Errors
  CART: {
    ADD_FAILED: 'Failed to add item to cart. Please try again.',
    UPDATE_FAILED: 'Failed to update cart. Please try again.',
    REMOVE_FAILED: 'Failed to remove item from cart. Please try again.',
    EMPTY_CART: 'Your cart is empty.',
  },

  ORDER: {
    CREATE_FAILED: 'Failed to place order. Please try again.',
    LOAD_FAILED: 'Failed to load order details. Please try again.',
    CANCEL_FAILED: 'Failed to cancel order. Please try again.',
    INVALID_ADDRESS: 'Please provide a valid delivery address.',
    PAYMENT_FAILED: 'Payment processing failed. Please try again.',
  },

  // Profile Errors
  PROFILE: {
    UPDATE_FAILED: 'Failed to update profile. Please try again.',
    LOAD_FAILED: 'Failed to load profile. Please try again.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    REQUIRED_FIELDS: 'Please fill in all required fields.',
  },

  // Wishlist Errors
  WISHLIST: {
    ADD_FAILED: 'Failed to add to wishlist. Please try again.',
    REMOVE_FAILED: 'Failed to remove from wishlist. Please try again.',
    LOAD_FAILED: 'Failed to load wishlist. Please try again.',
  },

  // File Upload Errors
  UPLOAD: {
    FAILED: 'Failed to upload file. Please try again.',
    TOO_LARGE: 'File is too large. Maximum size is 5MB.',
    INVALID_TYPE: 'Invalid file type. Please upload an image.',
  },

  // Generic Errors
  GENERIC: {
    UNKNOWN: 'An unexpected error occurred. Please try again.',
    TRY_AGAIN: 'Something went wrong. Please try again.',
    MAINTENANCE: 'The app is currently under maintenance. Please try again later.',
  },
};

/**
 * Get user-friendly error message from error object or string
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return ERROR_MESSAGES.GENERIC.UNKNOWN;

  // If error is already a string
  if (typeof error === 'string') {
    return parseErrorString(error);
  }

  // If error has message property
  if (error.message) {
    return parseErrorString(error.message);
  }

  // If error has error property (Supabase style)
  if (error.error) {
    return parseErrorString(error.error);
  }

  return ERROR_MESSAGES.GENERIC.UNKNOWN;
};

/**
 * Parse error string and return user-friendly message
 */
const parseErrorString = (errorStr: string): string => {
  const lowerError = errorStr.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK.NO_CONNECTION;
  }
  if (lowerError.includes('timeout')) {
    return ERROR_MESSAGES.NETWORK.TIMEOUT;
  }

  // Auth errors
  if (lowerError.includes('invalid login') || lowerError.includes('invalid credentials')) {
    return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
  }
  if (lowerError.includes('email not confirmed')) {
    return ERROR_MESSAGES.AUTH.EMAIL_NOT_CONFIRMED;
  }
  if (lowerError.includes('user not found')) {
    return ERROR_MESSAGES.AUTH.USER_NOT_FOUND;
  }
  if (lowerError.includes('already registered') || lowerError.includes('duplicate')) {
    return ERROR_MESSAGES.AUTH.EMAIL_IN_USE;
  }
  if (lowerError.includes('weak password') || lowerError.includes('password')) {
    return ERROR_MESSAGES.AUTH.WEAK_PASSWORD;
  }
  if (lowerError.includes('invalid email')) {
    return ERROR_MESSAGES.AUTH.INVALID_EMAIL;
  }
  if (lowerError.includes('session') || lowerError.includes('token')) {
    return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
  }

  // Database errors
  if (lowerError.includes('permission denied') || lowerError.includes('not allowed')) {
    return ERROR_MESSAGES.DATABASE.PERMISSION_DENIED;
  }
  if (lowerError.includes('not found') || lowerError.includes('no rows')) {
    return ERROR_MESSAGES.DATABASE.NOT_FOUND;
  }
  if (lowerError.includes('duplicate key') || lowerError.includes('unique constraint')) {
    return ERROR_MESSAGES.DATABASE.DUPLICATE_ENTRY;
  }

  // If no specific match, return the original error with better formatting
  return errorStr.charAt(0).toUpperCase() + errorStr.slice(1);
};

/**
 * Get error type from error message
 */
export const getErrorType = (error: any): 'network' | 'auth' | 'database' | 'validation' | 'unknown' => {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return 'network';
  }
  if (message.includes('sign in') || message.includes('password') || message.includes('email') || message.includes('session')) {
    return 'auth';
  }
  if (message.includes('permission') || message.includes('not found') || message.includes('duplicate')) {
    return 'database';
  }
  if (message.includes('invalid') || message.includes('required') || message.includes('format')) {
    return 'validation';
  }

  return 'unknown';
};
