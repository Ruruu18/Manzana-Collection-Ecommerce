// Debug configuration for development and testing
export const DEBUG_CONFIG = {
  // Enable/disable debug logging
  ENABLE_LOGGING: false,

  // Enable/disable specific debug categories
  AUTH_DEBUG: false,
  API_DEBUG: false,
  NAVIGATION_DEBUG: false,
  VALIDATION_DEBUG: false,

  // Test mode settings
  TEST_MODE: {
    ENABLED: false,
    AUTO_LOGIN: false,
    SKIP_EMAIL_VALIDATION: false,
    USE_MOCK_DATA: false,
  },

  // Development helpers
  DEV_HELPERS: {
    SHOW_DEV_MENU: __DEV__,
    ENABLE_FLIPPER: __DEV__,
    LOG_REDUX_ACTIONS: false,
    LOG_API_CALLS: __DEV__,
  },

  // Test credentials for development
  TEST_CREDENTIALS: {
    EMAIL: 'test@manzana.com',
    PASSWORD: 'test123',
    FULL_NAME: 'Test User',
    USER_TYPE: 'consumer' as const,
  },

  // API debugging
  API_TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    AUTH: 15000, // 15 seconds
    UPLOAD: 30000, // 30 seconds
  },

  // Error reporting
  ERROR_REPORTING: {
    ENABLED: !__DEV__, // Disable in dev, enable in production
    LOG_TO_CONSOLE: __DEV__,
    SEND_TO_SERVICE: false, // Set to true when you have error reporting service
  },
};

// Debug logger utility
export const debugLog = {
  auth: (...args: any[]) => {
    if (DEBUG_CONFIG.AUTH_DEBUG) {
      console.log('🔐 [AUTH]', ...args);
    }
  },

  api: (...args: any[]) => {
    if (DEBUG_CONFIG.API_DEBUG) {
      console.log('🌐 [API]', ...args);
    }
  },

  validation: (...args: any[]) => {
    if (DEBUG_CONFIG.VALIDATION_DEBUG) {
      console.log('✅ [VALIDATION]', ...args);
    }
  },

  navigation: (...args: any[]) => {
    if (DEBUG_CONFIG.NAVIGATION_DEBUG) {
      console.log('🧭 [NAVIGATION]', ...args);
    }
  },

  error: (...args: any[]) => {
    if (DEBUG_CONFIG.ERROR_REPORTING.LOG_TO_CONSOLE) {
      console.error('❌ [ERROR]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (DEBUG_CONFIG.ENABLE_LOGGING) {
      console.warn('⚠️  [WARNING]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (DEBUG_CONFIG.ENABLE_LOGGING) {
      console.info('ℹ️  [INFO]', ...args);
    }
  },

  success: (...args: any[]) => {
    if (DEBUG_CONFIG.ENABLE_LOGGING) {
      console.log('🎉 [SUCCESS]', ...args);
    }
  },
};

// Development menu items
export const DEV_MENU_ITEMS = [
  {
    title: 'Clear Storage',
    action: 'clearStorage',
    description: 'Clear all async storage data',
  },
  {
    title: 'Test Registration',
    action: 'testRegistration',
    description: 'Test registration with demo credentials',
  },
  {
    title: 'Test Login',
    action: 'testLogin',
    description: 'Test login with demo credentials',
  },
  {
    title: 'Reset Auth State',
    action: 'resetAuth',
    description: 'Reset authentication state',
  },
  {
    title: 'Toggle Mock Mode',
    action: 'toggleMock',
    description: 'Toggle between real and mock API calls',
  },
];

// Validation test cases for debugging
export const VALIDATION_TEST_CASES = {
  emails: [
    { email: 'test@example.com', expected: true },
    { email: 'user@test.co', expected: true },
    { email: 'mj@test.com', expected: true },
    { email: 'john.doe@gmail.com', expected: true },
    { email: 'invalid-email', expected: false },
    { email: '@domain.com', expected: false },
    { email: 'test@', expected: false },
    { email: '', expected: false },
  ],
  passwords: [
    { password: 'test123', expected: true },
    { password: 'password', expected: true },
    { password: '12345', expected: false },
    { password: '', expected: false },
  ],
};

// Environment checks
export const ENVIRONMENT_CHECKS = {
  isExpoGo: () => {
    return __DEV__ && typeof expo !== 'undefined';
  },

  hasSupabaseCredentials: () => {
    try {
      const { APP_CONFIG } = require('./theme');
      return !!(
        APP_CONFIG.API_URL &&
        APP_CONFIG.API_KEY &&
        APP_CONFIG.API_URL.includes('supabase.co')
      );
    } catch {
      return false;
    }
  },

  isDevMode: () => __DEV__,

  canUseRealAPI: () => {
    return ENVIRONMENT_CHECKS.hasSupabaseCredentials() && !DEBUG_CONFIG.TEST_MODE.USE_MOCK_DATA;
  },
};

// Performance monitoring
export const PERFORMANCE_MONITOR = {
  startTimer: (label: string) => {
    if (DEBUG_CONFIG.ENABLE_LOGGING) {
      console.time(`⏱️  ${label}`);
    }
  },

  endTimer: (label: string) => {
    if (DEBUG_CONFIG.ENABLE_LOGGING) {
      console.timeEnd(`⏱️  ${label}`);
    }
  },

  logMemory: () => {
    if (DEBUG_CONFIG.ENABLE_LOGGING && (global as any).performance?.memory) {
      const memory = (global as any).performance.memory;
      console.log('💾 [MEMORY]', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
      });
    }
  },
};

// Export default debug configuration
export default DEBUG_CONFIG;
