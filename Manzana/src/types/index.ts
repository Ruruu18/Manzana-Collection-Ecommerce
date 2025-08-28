export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_type: "consumer" | "reseller";
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  postal_code?: string;
  business_name?: string; // For resellers
  tax_id?: string; // For resellers
  notification_preferences: {
    push_promotions: boolean;
    push_stock_alerts: boolean;
    push_new_products: boolean;
    email_promotions: boolean;
    email_stock_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discounted_price?: number;
  sku: string;
  category_id: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // e.g., "Size S", "Color Red"
  type: "size" | "color" | "style";
  value: string; // e.g., "S", "Red", "V-neck"
  stock_quantity: number;
  price_adjustment: number; // Additional cost for this variant
  sku_suffix: string;
  is_active: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  promotion_type:
    | "percentage"
    | "fixed_amount"
    | "buy_x_get_y"
    | "free_shipping";
  discount_value: number;
  buy_quantity?: number;
  get_quantity?: number;
  terms_and_conditions?: string;
  min_purchase_amount?: number;
  applicable_to: "all" | "category" | "product" | "user_type";
  applicable_ids: string[]; // Category IDs, Product IDs, or User Types
  user_type_restriction?: "consumer" | "reseller";
  code?: string; // Promo code if required
  start_date: string;
  end_date: string;
  usage_limit?: number;
  usage_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  user_id: string;
  product_id: string;
  product_variant_id?: string;
  threshold_quantity: number;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  product_variant?: ProductVariant;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "promotion" | "stock_alert" | "order" | "system" | "product";
  data?: any; // Additional data payload
  image_url?: string;
  action_url?: string; // Deep link or navigation path
  is_read: boolean;
  is_sent: boolean;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  product_variant_id?: string;
  created_at: string;
  product?: Product;
  product_variant?: ProductVariant;
}

export interface Cart {
  id: string;
  user_id: string;
  product_id: string;
  product_variant_id?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  product_variant?: ProductVariant;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  promotion_code?: string;
  shipping_address: Address;
  billing_address: Address;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
  product_variant?: ProductVariant;
}

export interface Address {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MainTabs: undefined;
  Onboarding: undefined;
  ProfileSetup: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Catalog:
    | { featured?: boolean; newest?: boolean; categoryId?: string }
    | undefined;
  Promotions: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ProductDetails: { productId: string };
  CategoryProducts: { categoryId: string; categoryName: string };
  Search: { query?: string; categoryId?: string };
  PromotionDetails: { promotionId: string };
};

export type CatalogStackParamList = {
  CatalogScreen:
    | { featured?: boolean; newest?: boolean; categoryId?: string }
    | undefined;
  ProductDetails: { productId: string };
  Search: { query?: string; categoryId?: string };
};

export type PromotionsStackParamList = {
  PromotionsScreen: undefined;
  PromotionDetails: { promotionId: string };
  ProductDetails: { productId: string };
};

export type NotificationsStackParamList = {
  NotificationsScreen: undefined;
  NotificationDetails: { notificationId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Settings: undefined;
  Wishlist: undefined;
  StockAlerts: undefined;
  OrderHistory: undefined;
  EditProfile: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  userType: "consumer" | "reseller";
}

export interface ProfileSetupForm {
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  businessName?: string; // For resellers
  taxId?: string; // For resellers
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
  onSale?: boolean;
  tags?: string[];
}

export interface PromotionFilters {
  type?: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  category?: string;
  userType?: "consumer" | "reseller";
  activeOnly?: boolean;
}

// Hook Types
export interface UseAuthReturn {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<User>,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error?: string }>;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Component Props Types
export interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: string;
}

export interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  showWishlist?: boolean;
  showStockAlert?: boolean;
}

export interface PromotionCardProps {
  promotion: Promotion;
  onPress: (promotion: Promotion) => void;
  showCountdown?: boolean;
}

export interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    button: TextStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Import TextStyle and navigation types from React Native
import { TextStyle } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";

// Screen Props Types
export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, "HomeScreen">,
  BottomTabScreenProps<MainTabParamList>
>;

export type CatalogScreenProps = CompositeScreenProps<
  NativeStackScreenProps<CatalogStackParamList, "CatalogScreen">,
  BottomTabScreenProps<MainTabParamList>
>;

export type PromotionsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PromotionsStackParamList, "PromotionsScreen">,
  BottomTabScreenProps<MainTabParamList>
>;

export type NotificationsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<NotificationsStackParamList, "NotificationsScreen">,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, "ProfileScreen">,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProductDetailsScreenProps = NativeStackScreenProps<
  HomeStackParamList | CatalogStackParamList | PromotionsStackParamList,
  "ProductDetails"
>;

export type CategoryProductsScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "CategoryProducts"
>;

export type SearchScreenProps = NativeStackScreenProps<
  HomeStackParamList | CatalogStackParamList,
  "Search"
>;

export type PromotionDetailsScreenProps = NativeStackScreenProps<
  PromotionsStackParamList,
  "PromotionDetails"
>;

export type NotificationDetailsScreenProps = NativeStackScreenProps<
  NotificationsStackParamList,
  "NotificationDetails"
>;

export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "Login"
>;
export type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "Register"
>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "ForgotPassword"
>;

export type OnboardingScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Onboarding"
>;
export type ProfileSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ProfileSetup"
>;

export type SettingsScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  "Settings"
>;
export type WishlistScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  "Wishlist"
>;
export type StockAlertsScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  "StockAlerts"
>;
export type OrderHistoryScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  "OrderHistory"
>;
export type EditProfileScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  "EditProfile"
>;
