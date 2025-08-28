import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../constants/theme";

const supabaseUrl = APP_CONFIG.API_URL;
const supabaseAnonKey = APP_CONFIG.API_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== "" &&
  supabaseAnonKey.trim() !== "" &&
  supabaseUrl.includes("supabase.co");



let supabaseClient: any = null;

if (hasValidCredentials) {

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: { 'x-client-info': 'manzana-mobile' },
      },
    });

    // Test the connection
    supabaseClient.auth.getSession()
      .then(() => { /* Connection successful */ })
      .catch((error: any) => {
        throw error;
      });

  } catch (error) {

    throw error; // Don't fall back to mock client in production
  }
}

if (!supabaseClient) {

  // Mock Supabase client for development
  supabaseClient = {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { user: mockUser } }, error: null }),
      signInWithPassword: ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) =>
        Promise.resolve({
          data: { user: mockUser, session: { user: mockUser } },
          error: null,
        }),
      signUp: ({ email, password, options }: any) =>
        Promise.resolve({
          data: { user: mockUser, session: { user: mockUser } },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: (email: string) =>
        Promise.resolve({ error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Simulate authenticated session
        setTimeout(() => {
          callback("SIGNED_IN", { user: mockUser });
        }, 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) =>
          Promise.resolve({
            data: getMockData(table),
            error: null,
          }),
        single: () =>
          Promise.resolve({
            data: getMockData(table)[0] || null,
            error: null,
          }),
        or: (conditions: string) => ({
          order: (column: string, options?: any) => ({
            limit: (count: number) =>
              Promise.resolve({
                data: getMockData(table).slice(0, count),
                error: null,
              }),
          }),
        }),
        lte: (column: string, value: any) => ({
          gte: (column: string, value: any) => ({
            order: (column: string, options?: any) => ({
              limit: (count: number) =>
                Promise.resolve({
                  data: getMockData(table).slice(0, count),
                  error: null,
                }),
            }),
          }),
        }),
        order: (column: string, options?: any) => ({
          limit: (count: number) =>
            Promise.resolve({
              data: getMockData(table).slice(0, count),
              error: null,
            }),
        }),
        limit: (count: number) =>
          Promise.resolve({
            data: getMockData(table).slice(0, count),
            error: null,
          }),
      }),
      insert: (values: any) => {

        return Promise.resolve({ data: values, error: null });
      },
      update: (values: any) => ({
        eq: (column: string, value: any) => {

          return Promise.resolve({ data: values, error: null });
        },
      }),
      delete: () => ({
        eq: (column: string, value: any) =>
          Promise.resolve({ data: null, error: null }),
      }),
    }),
  };
}

// Mock user data for development
const mockUser = {
  id: "dev-user-123",
  email: "dev@example.com",
  full_name: "Development User",
  user_type: "consumer",
  phone: "555-0123",
  notification_preferences: {
    push_promotions: true,
    push_stock_alerts: true,
    push_new_products: true,
    email_promotions: true,
    email_stock_alerts: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock data generator
function getMockData(table: string) {
  switch (table) {
    case "promotions":
      return [
        {
          id: "1",
          title: "Summer Sale",
          description: "Up to 50% off on all summer collections",
          image_url: "https://picsum.photos/400/200?random=1",
          promotion_type: "percentage",
          discount_value: 50,
          start_date: new Date().toISOString(),
          end_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          is_featured: true,
          is_active: true,
        },
        {
          id: "2",
          title: "New Arrivals",
          description: "20% off on new arrivals this week",
          image_url: "https://picsum.photos/400/200?random=2",
          promotion_type: "percentage",
          discount_value: 20,
          start_date: new Date().toISOString(),
          end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          is_featured: true,
          is_active: true,
        },
      ];

    case "categories":
      return [
        {
          id: "1",
          name: "Dresses",
          description: "Beautiful dresses for every occasion",
          image_url: "https://picsum.photos/200/200?random=10",
          sort_order: 1,
          is_active: true,
        },
        {
          id: "2",
          name: "Tops",
          description: "Stylish tops and blouses",
          image_url: "https://picsum.photos/200/200?random=11",
          sort_order: 2,
          is_active: true,
        },
        {
          id: "3",
          name: "Bottoms",
          description: "Comfortable pants and skirts",
          image_url: "https://picsum.photos/200/200?random=12",
          sort_order: 3,
          is_active: true,
        },
        {
          id: "4",
          name: "Accessories",
          description: "Perfect accessories to complete your look",
          image_url: "https://picsum.photos/200/200?random=13",
          sort_order: 4,
          is_active: true,
        },
      ];

    case "products":
      return [
        {
          id: "1",
          name: "Elegant Summer Dress",
          description:
            "A beautiful and comfortable dress perfect for summer occasions",
          price: 89.99,
          discounted_price: 69.99,
          sku: "DRESS-001",
          category_id: "1",
          images: [
            {
              id: "1",
              product_id: "1",
              url: "https://picsum.photos/300/400?random=20",
              is_primary: true,
              sort_order: 1,
            },
          ],
          variants: [],
          stock_quantity: 15,
          is_active: true,
          is_featured: true,
          tags: ["summer", "elegant", "dress"],
          brand: "Manzana",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Casual Cotton Top",
          description: "Comfortable cotton top for everyday wear",
          price: 34.99,
          sku: "TOP-001",
          category_id: "2",
          images: [
            {
              id: "2",
              product_id: "2",
              url: "https://picsum.photos/300/400?random=21",
              is_primary: true,
              sort_order: 1,
            },
          ],
          variants: [],
          stock_quantity: 25,
          is_active: true,
          is_featured: true,
          tags: ["casual", "cotton", "top"],
          brand: "Manzana",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "High-Waist Jeans",
          description: "Stylish high-waist jeans that fit perfectly",
          price: 79.99,
          sku: "JEANS-001",
          category_id: "3",
          images: [
            {
              id: "3",
              product_id: "3",
              url: "https://picsum.photos/300/400?random=22",
              is_primary: true,
              sort_order: 1,
            },
          ],
          variants: [],
          stock_quantity: 12,
          is_active: true,
          is_featured: false,
          tags: ["jeans", "high-waist", "denim"],
          brand: "Manzana",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "4",
          name: "Statement Necklace",
          description: "Bold statement necklace to elevate any outfit",
          price: 45.99,
          sku: "ACC-001",
          category_id: "4",
          images: [
            {
              id: "4",
              product_id: "4",
              url: "https://picsum.photos/300/400?random=23",
              is_primary: true,
              sort_order: 1,
            },
          ],
          variants: [],
          stock_quantity: 8,
          is_active: true,
          is_featured: true,
          tags: ["necklace", "statement", "jewelry"],
          brand: "Manzana",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

    case "notifications":
      return [
        {
          id: "1",
          user_id: mockUser.id,
          title: "Welcome to Manzana!",
          message: "Thank you for joining our fashion community",
          type: "system",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: mockUser.id,
          title: "New Sale Alert",
          message: "Don't miss our summer sale - up to 50% off!",
          type: "promotion",
          is_read: false,
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ];

    default:
      return [];
  }
}

export const supabase = supabaseClient;

// Export development mode flag for debugging
export const isDevMode = !hasValidCredentials;


