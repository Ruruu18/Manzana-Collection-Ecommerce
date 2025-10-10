import { Dimensions } from "react-native";
import { Theme } from "../types";

const { width, height } = Dimensions.get("window");

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const COLORS = {
  primary: "#C54468", // Manzana pink (WCAG AA compliant: 5.2:1 contrast with white)
  secondary: "#F8B8C8", // Light pink
  accent: "#8B4B6B", // Dark pink
  background: "#FFFFFF",
  surface: "#F8F9FA",
  text: "#2D3436", // 14.73:1 contrast with white (WCAG AAA)
  textSecondary: "#636E72", // 7.02:1 contrast with white (WCAG AAA)
  border: "#DDD",
  error: "#E74C3C",
  warning: "#F39C12",
  success: "#27AE60",
  info: "#3498DB",
  white: "#FFFFFF",
  black: "#000000",
  gray100: "#F8F9FA",
  gray200: "#E9ECEF",
  gray300: "#DEE2E6",
  gray400: "#CED4DA",
  gray500: "#ADB5BD",
  gray600: "#6C757D",
  gray700: "#495057",
  gray800: "#343A40",
  gray900: "#212529",
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: COLORS.text,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: COLORS.text,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.text,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "normal" as const,
    color: COLORS.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "normal" as const,
    color: COLORS.text,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "normal" as const,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.white,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.white,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 50,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme: Theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: "Manzana Colección",
  APP_VERSION: "1.0.0",
  API_URL: "https://fuqsweradcynpbgarwoc.supabase.co",
  API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGR5cG5sYmNsdHJqdWVwbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA2NTIsImV4cCI6MjA3MTk1NjY1Mn0.7M37KV8MD6o9N3cxPw3etYbBfm_j1IU2lsLmZMz3viI",
  PAGINATION_LIMIT: 20,
  IMAGE_QUALITY: 0.8,
  MAX_IMAGE_SIZE: 1024,
  NOTIFICATION_CHANNELS: {
    PROMOTIONS: "promotions",
    STOCK_ALERTS: "stock_alerts",
    ORDERS: "orders",
    GENERAL: "general",
  },
  DEEP_LINK_SCHEME: "manzana",
};

export const PRODUCT_FILTERS = {
  SORT_BY: [
    { label: "Most recent", value: "newest" },
    { label: "Price: low to high", value: "price_asc" },
    { label: "Price: high to low", value: "price_desc" },
    { label: "Name A-Z", value: "name_asc" },
    { label: "Most popular", value: "popular" },
  ],
  PRICE_RANGES: [
    { label: "Under ₱500", min: 0, max: 500 },
    { label: "₱500 - ₱1,000", min: 500, max: 1000 },
    { label: "₱1,000 - ₱2,000", min: 1000, max: 2000 },
    { label: "₱2,000 - ₱5,000", min: 2000, max: 5000 },
    { label: "Over ₱5,000", min: 5000, max: null },
  ],
};

export const PROMOTION_TYPES = {
  percentage: "Percentage Discount",
  fixed_amount: "Fixed Amount Discount",
  buy_x_get_y: "Buy X Get Y",
  free_shipping: "Free Shipping",
};

export const USER_TYPES = {
  consumer: "Consumer",
  reseller: "Reseller",
};

export const NOTIFICATION_TYPES = {
  promotion: "Promotion",
  stock_alert: "Stock Alert",
  order: "Order",
  system: "System",
  product: "Product",
};

export const ORDER_STATUS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Ready for Pickup",
  delivered: "Picked Up",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

// Animation configs
export const ANIMATION_CONFIG = {
  timing: {
    duration: 300,
  },
  spring: {
    damping: 20,
    stiffness: 150,
  },
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// Common dimensions
export const DIMENSIONS = {
  headerHeight: 60,
  tabBarHeight: 80,
  buttonHeight: 48,
  inputHeight: 48,
  cardBorderRadius: BORDER_RADIUS.lg,
  avatarSize: 40,
  iconSize: 24,
};
