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

console.log("🔍 Supabase credentials check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlValid: supabaseUrl?.includes("supabase.co"),
  hasValidCredentials
});



let supabaseClient: any = null;

if (hasValidCredentials) {
  try {
    console.log("✅ Creating real Supabase client...");
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Fix for React Native networking issues
        flowType: 'pkce',
      },
      global: {
        headers: { 
          'x-client-info': 'manzana-mobile',
          'apikey': supabaseAnonKey,
        },
        fetch: (url, options = {}) => {
          const urlString = typeof url === 'string' ? url : url.toString();
          console.log('🔄 Supabase fetch:', urlString);
          
          // For REST API endpoints (/rest/v1/), add proper headers including Content-Type
          if (urlString.includes('/rest/v1/')) {
            return fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey,
                ...options.headers,
              },
            }).then(response => {
              // Check for API key related errors
              if (!response.ok) {
                if (response.status === 401) {
                  console.error('❌ Supabase API: Unauthorized - Check API key');
                } else if (response.status === 403) {
                  console.error('❌ Supabase API: Forbidden - Check permissions');
                }
              }
              return response;
            }).catch(error => {
              console.error('❌ Supabase fetch error:', error.message);
              throw error;
            });
          }
          
          // For auth endpoints and others, use default behavior
          return fetch(url, options);
        },
      },
      // Add realtime configuration to prevent connection issues
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    });

    // Test the connection and handle refresh token errors
    supabaseClient.auth.getSession()
      .then(() => { 
        console.log("✅ Supabase connection successful");
      })
      .catch(async (error: any) => {
        console.error("❌ Supabase connection error:", error.message);
        
        // If it's a refresh token error, clear the session
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log("🔄 Clearing invalid session from storage...");
          try {
            await supabaseClient.auth.signOut();
          } catch (signOutError) {
            console.error("❌ Error clearing invalid session:", signOutError);
          }
        }
      });

  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
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

// Helper function to handle common Supabase errors
export const handleSupabaseError = (error: any) => {
  if (!error) return null;
  
  console.error('🔍 Supabase error details:', error);
  
  // Handle specific error types
  if (error.message) {
    if (error.message.includes('No API key found')) {
      return {
        type: 'api_key_missing',
        message: 'API key is missing. Please check your Supabase configuration.',
        userMessage: 'Configuration error. Please contact support.'
      };
    }
    
    if (error.message.includes('invalid input syntax for type uuid')) {
      return {
        type: 'invalid_uuid',
        message: 'Invalid user ID format detected.',
        userMessage: 'Please sign out and sign back in to refresh your session.'
      };
    }
    
    if (error.message.includes('JWT expired') || error.message.includes('Invalid Refresh Token')) {
      return {
        type: 'session_expired',
        message: 'User session has expired.',
        userMessage: 'Your session has expired. Please sign in again.'
      };
    }
    
    if (error.message.includes('Invalid login credentials')) {
      return {
        type: 'invalid_credentials',
        message: 'Invalid email or password.',
        userMessage: 'Invalid email or password. Please try again.'
      };
    }
  }
  
  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 401:
        return {
          type: 'unauthorized',
          message: 'Unauthorized access.',
          userMessage: 'Authentication required. Please sign in.'
        };
      case 403:
        return {
          type: 'forbidden',
          message: 'Access forbidden.',
          userMessage: 'You do not have permission to perform this action.'
        };
      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many requests.',
          userMessage: 'Too many requests. Please wait a moment and try again.'
        };
      case 500:
        return {
          type: 'server_error',
          message: 'Internal server error.',
          userMessage: 'Server error. Please try again later.'
        };
    }
  }
  
  // Default error handling
  return {
    type: 'unknown',
    message: error.message || 'An unknown error occurred.',
    userMessage: 'Something went wrong. Please try again.'
  };
};


