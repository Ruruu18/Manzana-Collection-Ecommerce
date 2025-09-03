/**
 * Direct authentication utilities
 * Fallback methods when Supabase client fails
 */

const SUPABASE_URL = 'https://enxdypnlbcltrjuepldk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGR5cG5sYmNsdHJqdWVwbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA2NTIsImV4cCI6MjA3MTk1NjY1Mn0.7M37KV8MD6o9N3cxPw3etYbBfm_j1IU2lsLmZMz3viI';

export interface DirectSignUpParams {
  email: string;
  password: string;
  full_name?: string;
  user_type?: string;
}

export interface DirectAuthResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Direct signup using fetch API
 * Bypasses Supabase client in case of networking issues
 */
export const directSignUp = async (params: DirectSignUpParams): Promise<DirectAuthResponse> => {
  try {
    console.log('🔄 Attempting direct signup via fetch API...');
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        data: {
          full_name: params.full_name,
          user_type: params.user_type,
        },
      }),
    });

    const responseText = await response.text();
    console.log('🔄 Direct signup response status:', response.status);
    console.log('🔄 Direct signup response:', responseText.substring(0, 200));

    if (!response.ok) {
      let errorMessage = 'Signup failed';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.msg || errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = JSON.parse(responseText);
    console.log('✅ Direct signup successful');
    
    return {
      success: true,
      data,
    };
    
  } catch (error: any) {
    console.error('❌ Direct signup failed:', error.message);
    
    return {
      success: false,
      error: `Direct signup failed: ${error.message}`,
    };
  }
};

/**
 * Direct signin using fetch API
 */
export const directSignIn = async (email: string, password: string): Promise<DirectAuthResponse> => {
  try {
    console.log('🔄 Attempting direct signin via fetch API...');
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const responseText = await response.text();
    console.log('🔄 Direct signin response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Signin failed';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error_description || errorData.msg || errorMessage;
      } catch (parseError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = JSON.parse(responseText);
    console.log('✅ Direct signin successful');
    
    return {
      success: true,
      data,
    };
    
  } catch (error: any) {
    console.error('❌ Direct signin failed:', error.message);
    
    return {
      success: false,
      error: `Direct signin failed: ${error.message}`,
    };
  }
};


