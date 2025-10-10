import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Export error utilities
export * from './errorMessages';

// Export toast utilities
export * from './toast';

// Export category icon utilities
export * from './categoryIcons';

// Export promotion utilities
export * from './promotionUtils';

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
};

// Format date with time
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

// Format relative time (e.g., "2 hours ago") - Philippine Time aware
export const formatRelativeTime = (date: string | Date): string => {
  // Parse the timestamp from database
  const timestamp = typeof date === "string" ? new Date(date) : date;

  // Get current time
  const now = new Date();

  // Calculate the difference in milliseconds
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInMinutes = Math.floor(Math.abs(diffInMs) / (1000 * 60));
  const diffInHours = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60));
  const diffInDays = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else {
    return formatDate(timestamp);
  }
};

// Calculate discount percentage
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountedPrice: number,
): number => {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Validate email - extremely permissive for testing
export const validateEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Super permissive email validation for testing
  // Just check for @ symbol and basic structure
  const hasAt = trimmedEmail.includes("@");
  const atIndex = trimmedEmail.indexOf("@");

  if (!hasAt) return false;
  if (atIndex === 0 || atIndex === trimmedEmail.length - 1) return false;
  if (trimmedEmail.split("@").length !== 2) return false;
  
  const parts = trimmedEmail.split("@");
  const localPart = parts[0];
  const domainPart = parts[1];
  
  // Very basic checks
  if (localPart.length === 0 || domainPart.length === 0) return false;
  
  // Allow any domain format for testing (even without dots)
  // This makes it extremely permissive for testing purposes
  return localPart.length > 0 && domainPart.length > 0;
};

// Validate password - more lenient for testing
export const validatePassword = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || password.trim().length === 0) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  // Removed strict requirements for testing - only check length
  return {
    isValid: password.length >= 6,
    errors,
  };
};

// Validate phone number (Mexican format)
export const validatePhone = (phone: string): boolean => {
  // Philippine phone format: +63 9XX XXX XXXX or 09XX XXX XXXX
  const cleanPhone = phone.replace(/\s/g, "");
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

// Format phone number
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");

  // Philippine mobile: 09XX XXX XXXX or +63 9XX XXX XXXX
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
    return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7, 11)}`;
  }

  if (cleanPhone.length === 12 && cleanPhone.startsWith("63")) {
    return `+63 ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 8)} ${cleanPhone.slice(8, 12)}`;
  }

  return phone;
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Haptic feedback
export const hapticFeedback = {
  light: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  heavy: () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  success: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};

// Image optimization
export const optimizeImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality?: number,
): string => {
  if (!url) return "";

  // If it's a Supabase Storage URL, add transformation parameters
  if (url.includes("supabase")) {
    const params = new URLSearchParams();
    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());
    if (quality) params.append("quality", quality.toString());

    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  }

  return url;
};

// Calculate time until date
export const getTimeUntilDate = (targetDate: string | Date) => {
  const target =
    typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { expired: false, days, hours, minutes, seconds };
};

// Convert RGB to hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("")}`;
};

// Convert hex to RGB
export const hexToRgb = (
  hex: string,
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate contrast ratio
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Remove accents from text
export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === "object") {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (typeof obj === "string" || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
};

// Sleep function
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Safe JSON parse
export const safeJsonParse = <T>(str: string, defaultValue: T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Generate random string
export const randomString = (length: number): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate reading time
export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Check if string is URL
export const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Sort product images to put primary first
export const sortProductImages = (images: any[]): any[] => {
  if (!images || images.length === 0) return [];

  return images.sort((a: any, b: any) => {
    // Primary images come first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;

    // If both are primary or both are not primary, sort by sort_order
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }

    // If sort_order is not available, maintain original order
    return 0;
  });
};

// Sort products with their images
export const sortProductsWithImages = <T extends { images?: any[] }>(
  products: T[],
): T[] => {
  if (!products || products.length === 0) return [];

  return products.map((product) => ({
    ...product,
    images: sortProductImages(product.images || []),
  }));
};

// Sort wishlist items with product images
export const sortWishlistItemsWithImages = <
  T extends { product?: { images?: any[] } },
>(
  items: T[],
): T[] => {
  if (!items || items.length === 0) return [];

  return items.map((item) => ({
    ...item,
    product: item.product
      ? {
          ...item.product,
          images: sortProductImages(item.product.images || []),
        }
      : item.product,
  }));
};

// Get primary image from product
export const getPrimaryImage = (images: any[]): any | null => {
  if (!images || images.length === 0) return null;

  const sortedImages = sortProductImages(images);
  return sortedImages[0] || null;
};

// Get primary image URL from product
export const getPrimaryImageUrl = (
  images: any[],
  fallback?: string,
): string => {
  const primaryImage = getPrimaryImage(images);
  return primaryImage?.url || fallback || "";
};

import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear corrupted authentication session
export const clearCorruptedSession = async (): Promise<void> => {
  try {
    
    // Clear all Supabase related keys
    const keys = [
      'supabase.auth.token',
      'sb-auth-token',
      'supabase.session',
      'sb-session'
    ];
    
    for (const key of keys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    }
    
    console.log("✅ Cleared corrupted session from storage");
  } catch (error) {
    console.error("❌ Error clearing corrupted session:", error);
  }
};
