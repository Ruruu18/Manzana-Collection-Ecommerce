import { createClient } from '@supabase/supabase-js'

// Load from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Check if we have valid Supabase credentials
const hasValidCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== "" && 
  supabaseAnonKey.trim() !== "" && 
  supabaseUrl.includes("supabase.co")

console.log('DEBUG ENV:', { url: supabaseUrl, keyLength: supabaseAnonKey?.length, hasValidCredentials })

// Force use of real Supabase client for CRUD operations - DISABLE RLS ISSUES
const forceRealClient = true
const BYPASS_AUTH_FOR_DEVELOPMENT = false

// Clear any cached invalid auth tokens from old URLs only on first setup
const hasValidSession = localStorage.getItem('sb-fuqsweradcynpbgarwoc-auth-token')
if (!hasValidSession) {
  console.log('🧹 Clearing old cached auth tokens to prevent conflicts')
  // Clear tokens from old URLs only
  localStorage.removeItem('sb-mnnysiucgmhwuxyvxzyg-auth-token')
  // Clear other potential old supabase items but preserve current ones
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && !key.includes('fuqsweradcynpbgarwoc')) {
      localStorage.removeItem(key)
    }
  })
}

// Mock user data for development
const mockUser = {
  id: "dev-user-123",
  email: "admin@manzana.com",
  full_name: "Admin User",
  user_type: "admin",
  phone: "555-0123",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

let supabaseClient: any = null

if (hasValidCredentials || forceRealClient) {
  try {
    console.log('🚀 Creating real Supabase client for CRUD operations')
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      global: {
        headers: { 'x-client-info': 'manzana-web-admin-dev' },
      },
    })
    console.log('✅ Real Supabase client created successfully')
    console.log('🔥 BYPASS_AUTH_FOR_DEVELOPMENT:', BYPASS_AUTH_FOR_DEVELOPMENT)
  } catch (error) {
    console.error('❌ Failed to create real Supabase client:', error)
    if (!forceRealClient) {
      supabaseClient = null
    } else {
      throw error // Don't fall back to mock when forcing real client
    }
  }
}

if (!supabaseClient && !forceRealClient) {
  console.log('🧪 Using mock Supabase client for development')
  
  // Mock Supabase client for development
  const getMockSession = () => {
    const savedSession = localStorage.getItem('mock-auth-session')
    return savedSession ? JSON.parse(savedSession) : null
  }

  const setMockSession = (session: any) => {
    if (session) {
      localStorage.setItem('mock-auth-session', JSON.stringify(session))
    } else {
      localStorage.removeItem('mock-auth-session')
    }
  }

  supabaseClient = {
    auth: {
      getSession: () => {
        const session = getMockSession()
        return Promise.resolve({ data: { session }, error: null })
      },
      getUser: () => {
        const session = getMockSession()
        return Promise.resolve({ data: { user: session?.user || null }, error: null })
      },
      signInWithPassword: ({ email }: { email: string; password: string }) => {
        console.log('🧪 Mock sign in attempt for:', email);
        // Simple mock authentication - accept any email/password for admin
        if (email.includes("admin") || email.includes("test")) {
          const mockUserForEmail = {
            ...mockUser,
            email: email, // Use the actual login email
            id: `mock-${email.replace(/[^a-zA-Z0-9]/g, '-')}`
          };
          const session = { user: mockUserForEmail, access_token: 'mock-token', refresh_token: 'mock-refresh' }
          setMockSession(session)
          console.log('✅ Mock login successful for:', email);
          return Promise.resolve({
            data: { user: mockUserForEmail, session },
            error: null,
          })
        }
        console.log('❌ Mock login failed for:', email);
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        })
      },
      signUp: ({ email: _email, password: _password, options: _options }: any) => {
        const session = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock-refresh' }
        setMockSession(session)
        return Promise.resolve({
          data: { user: mockUser, session },
          error: null,
        })
      },
      signOut: () => {
        console.log('🧪 Mock sign out')
        setMockSession(null)
        return Promise.resolve({ error: null })
      },
      refreshSession: () => {
        const session = getMockSession()
        return Promise.resolve({ data: { session }, error: null })
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Check for existing session on initialization
        setTimeout(() => {
          const existingSession = getMockSession()
          if (existingSession) {
            callback("SIGNED_IN", existingSession)
          } else {
            callback("SIGNED_OUT", null)
          }
        }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table: string) => ({
      select: (_columns?: string) => {
        const mockData = getMockData(table);
        return {
          eq: (column: string, value: any) => {
            const filtered = mockData.filter((item: any) => item[column] === value);
            return Promise.resolve({
              data: filtered,
              error: null,
              count: filtered.length,
            });
          },
          in: (column: string, values: any[]) => {
            const filtered = mockData.filter((item: any) => values.includes(item[column]));
            return Promise.resolve({
              data: filtered,
              error: null,
              count: filtered.length,
            });
          },
          order: (column: string, options?: { ascending?: boolean }) => ({
            limit: (count: number) => {
              const sorted = [...mockData].sort((a: any, b: any) => {
                const aVal = a[column];
                const bVal = b[column];
                if (options?.ascending === false) {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
              return Promise.resolve({
                data: sorted.slice(0, count),
                error: null,
              });
            },
            then: (onResolve: any) => {
              const sorted = [...mockData].sort((a: any, b: any) => {
                const aVal = a[column];
                const bVal = b[column];
                if (options?.ascending === false) {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
              return onResolve({
                data: sorted,
                error: null,
                count: sorted.length,
              });
            }
          }),
          limit: (count: number) =>
            Promise.resolve({
              data: mockData.slice(0, count),
              error: null,
            }),
          single: () =>
            Promise.resolve({
              data: mockData[0] || null,
              error: null,
            }),
          then: (onResolve: any) => onResolve({
            data: mockData,
            error: null,
            count: mockData.length,
          })
        };
      },
      insert: (values: any) => {
        const allData = getStoredMockData();
        const items = Array.isArray(values) ? values : [values];
        const newItems = items.map((item: any) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          created_at: item.created_at || new Date().toISOString(),
        }));
        
        if (!allData[table]) allData[table] = [];
        allData[table].push(...newItems);
        setStoredMockData(allData);
        
        return {
          select: (_columns?: string) => ({
            single: () => Promise.resolve({
              data: newItems[0] || null,
              error: null,
            }),
            then: (onResolve: any) => onResolve({
              data: newItems,
              error: null,
              count: newItems.length,
            })
          }),
          then: (onResolve: any) => onResolve({
            data: newItems,
            error: null,
            count: newItems.length,
          })
        };
      },
      update: (values: any) => ({
        eq: (column: string, value: any) => {
          const allData = getStoredMockData();
          if (!allData[table]) allData[table] = [];
          
          const index = allData[table].findIndex((item: any) => item[column] === value);
          if (index >= 0) {
            allData[table][index] = { ...allData[table][index], ...values };
            setStoredMockData(allData);
          }
          
          return Promise.resolve({ 
            data: index >= 0 ? allData[table][index] : null, 
            error: null 
          });
        },
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          const allData = getStoredMockData();
          if (!allData[table]) allData[table] = [];
          
          const initialLength = allData[table].length;
          allData[table] = allData[table].filter((item: any) => item[column] !== value);
          setStoredMockData(allData);
          
          return Promise.resolve({ 
            data: null, 
            error: null,
            count: initialLength - allData[table].length
          });
        },
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, _file: File, _options?: any) =>
          Promise.resolve({ 
            data: { path: `mock/${path}` }, 
            error: null 
          }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/storage/${bucket}/${path}` }
        })
      })
    }
  }
}

// Mock data storage with persistence
const MOCK_STORAGE_KEY = 'manzana-mock-data';

function getStoredMockData() {
  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredMockData(data: any) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store mock data:', error);
  }
}

// Initialize mock data if not exists
function initializeMockData() {
  const stored = getStoredMockData();
  if (!stored.products) {
    const initialData = {
      products: getInitialMockProducts(),
      categories: getInitialMockCategories(),
      promotions: getInitialMockPromotions(),
      orders: getInitialMockOrders(),
      users: getInitialMockUsers(),
      product_images: []
    };
    setStoredMockData(initialData);
    return initialData;
  }
  return stored;
}

// Mock data generator for development
function getMockData(table: string) {
  const allData = initializeMockData();
  return allData[table] || [];
}

function getInitialMockProducts() {
  return [
    {
      id: "1",
      name: "Elegant Summer Dress",
      description: "Beautiful floral summer dress perfect for any occasion",
      price: 89.99,
      sku: "DRESS-001",
      stock_quantity: 25,
      category_id: "1",
      is_active: true,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2", 
      name: "Classic Business Blouse",
      description: "Professional white blouse for business wear",
      price: 65.50,
      sku: "BLOUSE-001",
      stock_quantity: 18,
      category_id: "1",
      is_active: true,
      created_at: "2024-01-14T14:30:00Z",
    },
    {
      id: "3",
      name: "Casual Denim Jacket",
      description: "Trendy denim jacket for casual outings",
      price: 120.00,
      sku: "JACKET-001", 
      stock_quantity: 12,
      category_id: "2",
      is_active: true,
      created_at: "2024-01-13T09:15:00Z",
    },
    {
      id: "4",
      name: "Designer Handbag",
      description: "Luxury leather handbag with gold accents",
      price: 299.99,
      sku: "BAG-001",
      stock_quantity: 8,
      category_id: "3", 
      is_active: true,
      created_at: "2024-01-12T16:45:00Z",
    },
    {
      id: "5",
      name: "Silk Scarf Collection",
      description: "Set of 3 premium silk scarves in various colors",
      price: 45.00,
      sku: "SCARF-SET-001",
      stock_quantity: 30,
      category_id: "3",
      is_active: true,
      created_at: "2024-01-11T11:20:00Z",
    }
  ];
}

function getInitialMockCategories() {
  return [
    {
      id: "1",
      name: "Dresses & Tops",
      description: "Beautiful dresses and stylish tops for every occasion",
      is_active: true,
    },
    {
      id: "2", 
      name: "Outerwear",
      description: "Jackets, coats, and outdoor clothing",
      is_active: true,
    },
    {
      id: "3",
      name: "Accessories",
      description: "Handbags, scarves, and fashion accessories",
      is_active: true,
    }
  ];
}

function getInitialMockPromotions() {
  return [
    {
      id: "1",
      title: "Summer Sale",
      description: "20% off all summer dresses and accessories",
      discount_value: 20,
      is_active: true,
    },
    {
      id: "2",
      title: "New Customer Welcome",
      description: "15% off your first purchase",
      discount_value: 15,
      is_active: true,
    }
  ];
}

function getInitialMockOrders() {
  return [
    {
      id: "order-1",
      total_amount: "129.99",
      status: "completed",
      created_at: "2024-01-20T14:30:00Z",
      users: { full_name: "María González", email: "maria@example.com" }
    },
    {
      id: "order-2", 
      total_amount: "89.99",
      status: "pending",
      created_at: "2024-01-20T10:15:00Z",
      users: { full_name: "Ana Rodríguez", email: "ana@example.com" }
    },
    {
      id: "order-3",
      total_amount: "299.99", 
      status: "shipped",
      created_at: "2024-01-19T16:45:00Z",
      users: { full_name: "Carmen López", email: "carmen@example.com" }
    }
  ];
}

function getInitialMockUsers() {
  return [
    {
      id: "user-1",
      email: "maria@example.com",
      full_name: "María González",
      user_type: "consumer"
    },
    {
      id: "user-2",
      email: "ana@example.com", 
      full_name: "Ana Rodríguez",
      user_type: "consumer"
    },
    {
      id: "user-3",
      email: "staff@test.com",
      full_name: "Staff Member",
      user_type: "staff"
    }
  ];
}



export const supabase = supabaseClient

// Export development mode flag for debugging
export const isDevMode = !hasValidCredentials
