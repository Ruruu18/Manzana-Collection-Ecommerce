import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get environment variables from Expo
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate Supabase credentials
if (!supabaseUrl || supabaseUrl.trim() === '') {
  throw new Error('Supabase URL is required but not provided');
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  throw new Error('Supabase Anon Key is required but not provided');
}

const hasValidCredentials =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== "" &&
  supabaseAnonKey.trim() !== "" &&
  supabaseUrl.includes("supabase.co");

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Development mode check
export const isDevMode = !hasValidCredentials;

// Error handling utility
export interface SupabaseErrorInfo {
  code?: string;
  message: string;
  userMessage: string;
  isAuthError: boolean;
  isNetworkError: boolean;
}

export const handleSupabaseError = (error: any): SupabaseErrorInfo => {
  console.error('🚨 Supabase Error:', error);

  // Default error info
  const errorInfo: SupabaseErrorInfo = {
    code: error?.code || 'UNKNOWN_ERROR',
    message: error?.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.',
    isAuthError: false,
    isNetworkError: false,
  };

  // Handle different types of errors
  if (error?.message) {
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('invalid login') || message.includes('invalid credentials')) {
      errorInfo.userMessage = 'Invalid email or password. Please check your credentials.';
      errorInfo.isAuthError = true;
    } else if (message.includes('email not confirmed')) {
      errorInfo.userMessage = 'Please check your email and click the confirmation link.';
      errorInfo.isAuthError = true;
    } else if (message.includes('user not found')) {
      errorInfo.userMessage = 'No account found with this email address.';
      errorInfo.isAuthError = true;
    } else if (message.includes('email already registered') || message.includes('user already registered')) {
      errorInfo.userMessage = 'An account with this email already exists. Try signing in instead.';
      errorInfo.isAuthError = true;
    } else if (message.includes('weak password')) {
      errorInfo.userMessage = 'Password is too weak. Please choose a stronger password.';
      errorInfo.isAuthError = true;
    } else if (message.includes('invalid email')) {
      errorInfo.userMessage = 'Please enter a valid email address.';
      errorInfo.isAuthError = true;
    }
    
    // Network errors
    else if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      errorInfo.userMessage = 'Network error. Please check your internet connection and try again.';
      errorInfo.isNetworkError = true;
    }
    
    // Database/Permission errors
    else if (message.includes('permission denied') || message.includes('rls')) {
      errorInfo.userMessage = 'Access denied. Please contact support if this persists.';
    } else if (message.includes('duplicate key') || message.includes('unique constraint')) {
      errorInfo.userMessage = 'This information already exists. Please use different details.';
    }
    
    // Rate limiting
    else if (message.includes('rate limit') || message.includes('too many requests')) {
      errorInfo.userMessage = 'Too many requests. Please wait a moment and try again.';
    }
    
    // Server errors
    else if (message.includes('internal server error') || message.includes('500')) {
      errorInfo.userMessage = 'Server error. Please try again in a few moments.';
    }
  }

  // Handle specific error codes
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        errorInfo.userMessage = 'No data found or access denied.';
        break;
      case 'PGRST301':
        errorInfo.userMessage = 'Database query error. Please contact support.';
        break;
      case '23505':
        errorInfo.userMessage = 'This information already exists.';
        break;
      case '42501':
        errorInfo.userMessage = 'Access denied. Please contact support.';
        break;
    }
  }

  return errorInfo;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export default supabase;