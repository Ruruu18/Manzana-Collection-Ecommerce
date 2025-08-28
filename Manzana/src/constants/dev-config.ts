/**
 * Development Configuration
 *
 * This file contains development-only settings that make it easier to test
 * the app without requiring full backend setup or going through the complete
 * onboarding flow.
 *
 * IMPORTANT: These settings should only be used during development!
 */

export const DEV_CONFIG = {
  // Authentication & Navigation
  BYPASS_AUTH: false,             // Use real authentication
  BYPASS_PROFILE_SETUP: false,    // Use real profile setup
  BYPASS_ONBOARDING: false,       // Use real onboarding

  // API & Data
  USE_MOCK_DATA: false,           // Use real API calls
  SHOW_API_ERRORS: false,         // Hide API error messages in console

  // UI & Testing
  SHOW_DEV_INFO: true,            // Show development info in UI
  ENABLE_DEBUG_LOGS: true,        // Enable detailed console logging
  FAST_ANIMATIONS: true,          // Speed up animations for faster testing

  // Mock User Data (used when BYPASS_AUTH is true)
  MOCK_USER: {
    id: "dev-user-123",
    email: "test@example.com",
    full_name: "Test User",
    user_type: "consumer" as const,
    phone: "555-0123",
    address: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zip_code: "12345",
    notification_preferences: {
      push_promotions: true,
      push_stock_alerts: true,
      push_new_products: true,
      email_promotions: true,
      email_stock_alerts: true,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Quick Access - Jump directly to specific screens for testing
  QUICK_ACCESS: {
    ENABLED: true,
    DEFAULT_SCREEN: "Main", // "Auth", "ProfileSetup", "Main", "Onboarding"
  },

  // Mock API Response Delays (in milliseconds)
  API_DELAYS: {
    AUTH: 500,
    DATA_FETCH: 300,
    DATA_UPDATE: 400,
  },
};

// Helper function to check if we're in development mode
export const isDevelopmentMode = (): boolean => {
  return __DEV__;
};

// Helper to log development messages
export const devLog = (message: string, ...args: any[]): void => {
  if (DEV_CONFIG.ENABLE_DEBUG_LOGS && isDevelopmentMode()) {
    console.log(`🚧 DEV: ${message}`, ...args);
  }
};

// Helper to simulate API delays in development
export const devDelay = (type: keyof typeof DEV_CONFIG.API_DELAYS = 'DATA_FETCH'): Promise<void> => {
  if (!isDevelopmentMode() || !DEV_CONFIG.USE_MOCK_DATA) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    setTimeout(resolve, DEV_CONFIG.API_DELAYS[type]);
  });
};

// Show development banner in console
if (isDevelopmentMode()) {
  console.log(`
  🚧 DEVELOPMENT MODE ACTIVE 🚧

  Quick Settings:
  - Bypass Auth: ${DEV_CONFIG.BYPASS_AUTH ? '✅' : '❌'}
  - Bypass Profile Setup: ${DEV_CONFIG.BYPASS_PROFILE_SETUP ? '✅' : '❌'}
  - Use Mock Data: ${DEV_CONFIG.USE_MOCK_DATA ? '✅' : '❌'}
  - Default Screen: ${DEV_CONFIG.QUICK_ACCESS.DEFAULT_SCREEN}

  To modify these settings, edit: src/constants/dev-config.ts
  `);
}
