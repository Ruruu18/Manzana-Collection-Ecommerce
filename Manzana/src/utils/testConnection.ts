import { supabase } from "../services/supabase";
import { APP_CONFIG } from "../constants/theme";

export const testSupabaseConnection = async () => {
  try {

    
    // Step 1: Check configuration
    const hasValidConfig = !!(
      APP_CONFIG.API_URL &&
      APP_CONFIG.API_KEY &&
      APP_CONFIG.API_URL.includes("supabase.co")
    );

    if (!hasValidConfig) {

      return {
        success: false,
        error: "Invalid Supabase configuration"
      };
    }



    // Step 2: Test network connectivity with multiple endpoints and retries
    const endpoints = [
      APP_CONFIG.API_URL,
      'https://api.supabase.io',
      'https://google.com',  // Fallback to check general internet connectivity
      'https://cloudflare.com',  // Additional fallback
      'https://1.1.1.1'  // DNS fallback
    ];

    const networkRetries = 3;  // Maximum number of retry attempts per endpoint
    const retryDelay = 2000;  // Delay between retries in milliseconds

    let networkConnected = false;
    for (const endpoint of endpoints) {
      for (let attempt = 0; attempt < networkRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(endpoint, {
            method: "HEAD",
            mode: "no-cors",
            signal: controller.signal,
            cache: 'no-cache'  // Prevent cached responses
          });

          clearTimeout(timeoutId);
          networkConnected = true;

          break;  // Break out of retry loop on success
        } catch (error) {

          if (attempt < networkRetries - 1) {

            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }
      }
      if (networkConnected) break;  // Break out of endpoint loop if we got a connection
    }

    if (!networkConnected) {

      return {
        success: false,
        error: "Network connectivity failed"
      };
    }

    // Step 3: Test Supabase client with retry
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.from("users").select("id").limit(1);
        
        if (error) {
          if (error.message.includes("JWT")) {

            return {
              success: false,
              error: "Authentication failed - invalid API key"
            };
          }
          
          if (attempt < maxRetries) {
            console.log(`⚠️ Database query failed, retrying... (${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            continue;
          }
          
          console.error("❌ Database query failed:", error.message);
          return {
            success: false,
            error: `Database query failed: ${error.message}`
          };
        }


        return {
          success: true
        };
      } catch (error: any) {
        if (attempt < maxRetries) {
          console.log(`⚠️ Supabase client error, retrying... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ Supabase client error:", error.message);
        return {
          success: false,
          error: `Supabase client error: ${error.message}`
        };
      }
    }

    return {
      success: false,
      error: "Failed to connect after all retries"
    };
  } catch (error: any) {
    console.error("❌ Unexpected error during connection test:", error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
};

// Helper function to format error messages for users
export const getConnectionErrorMessage = (error: string): string => {
  if (error.includes("Network connectivity failed")) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  if (error.includes("Authentication failed")) {
    return "Authentication error. Please contact support if this persists.";
  }
  if (error.includes("Database query failed")) {
    return "Server communication error. Please try again later.";
  }
  return "An unexpected error occurred. Please try again later.";
};
