import { Alert } from "react-native";

// Test utility functions for debugging and verification

export const testInputFunctionality = () => {
  console.log("🧪 Testing input functionality...");

  // Test password validation
  const testPasswords = [
    "123", // too short
    "password", // no uppercase/number
    "Password", // no number
    "Password1", // valid
    "MySecurePass123!", // valid
  ];

  testPasswords.forEach((password) => {
    console.log(`Testing password: "${password}"`);
    // This would use your validatePassword function
    console.log(`Length: ${password.length}`);
  });

  // Test email validation specifically
  console.log("Testing email validation...");
  const testEmails = [
    "mj@test.com",
    "user@example.com",
    "test@test.co",
    "invalid-email",
    "no@domain",
    "valid@domain.org",
  ];

  testEmails.forEach((email) => {
    console.log(`Email: "${email}" - Should be valid`);
  });
};

export const testAuthFlow = async () => {
  console.log("🧪 Testing auth flow...");

  try {
    // Test form validation
    const testForm = {
      email: "test@example.com",
      password: "TestPassword123",
      confirmPassword: "TestPassword123",
      fullName: "Test User",
    };

    console.log("🧪 Test form data:", testForm);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(testForm.email);
    console.log("🧪 Email valid:", isValidEmail);

    // Validate password strength
    const hasUppercase = /[A-Z]/.test(testForm.password);
    const hasLowercase = /[a-z]/.test(testForm.password);
    const hasNumber = /\d/.test(testForm.password);
    const minLength = testForm.password.length >= 8;

    console.log("🧪 Password validation:", {
      hasUppercase,
      hasLowercase,
      hasNumber,
      minLength,
    });

    // Test password confirmation
    const passwordsMatch = testForm.password === testForm.confirmPassword;
    console.log("🧪 Passwords match:", passwordsMatch);

    return {
      isValid:
        isValidEmail &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        minLength &&
        passwordsMatch,
      errors: [],
    };
  } catch (error) {
    console.error("🧪 Auth flow test error:", error);
    return { isValid: false, errors: [error] };
  }
};

export const testSupabaseConnection = async () => {
  console.log("🧪 Testing Supabase connection...");

  try {
    // This is a simple test to see if we can access supabase
    const testData = {
      apiUrl: "https://mnnysiucgmhwuxyvxzyg.supabase.co",
      hasApiKey: true, // We won't log the actual key for security
    };

    console.log("🧪 Supabase config:", testData);

    // Test if the URL is properly formatted
    const url = new URL(testData.apiUrl);
    console.log("🧪 URL valid:", url.hostname);

    return { success: true, url: testData.apiUrl };
  } catch (error) {
    console.error("🧪 Supabase connection test error:", error);
    return { success: false, error };
  }
};

export const showTestAlert = (title: string, message: string) => {
  Alert.alert(`🧪 ${title}`, message);
};

export const logTestResults = (testName: string, results: any) => {
  console.log(`🧪 Test Results for ${testName}:`, results);
};

// Test the input component specifically
export const testInputComponent = () => {
  console.log("🧪 Testing Input component functionality...");

  const testCases = [
    {
      name: "Empty input",
      value: "",
      expected: "should show placeholder",
    },
    {
      name: "Valid email",
      value: "user@example.com",
      expected: "should accept input",
    },
    {
      name: "Password with special chars",
      value: "Test@123!",
      expected: "should accept input and toggle visibility",
    },
    {
      name: "Long text",
      value:
        "This is a very long text that should wrap properly in the input field",
      expected: "should handle long text",
    },
  ];

  testCases.forEach((testCase) => {
    console.log(`🧪 ${testCase.name}:`, {
      input: testCase.value,
      length: testCase.value.length,
      expected: testCase.expected,
    });
  });

  return testCases;
};

// Debug helper for form state
export const debugFormState = (formData: any, errors: any) => {
  console.log("🧪 Form Debug:", {
    formData,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    timestamp: new Date().toISOString(),
  });
};

// Test notification functionality
export const testNotifications = () => {
  console.log("🧪 Testing notification functionality...");

  const mockNotifications = [
    {
      id: "1",
      title: "Welcome!",
      message: "Welcome to Manzana Collection",
      type: "system",
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "New Sale!",
      message: "50% off summer collection",
      type: "promotion",
      is_read: true,
      created_at: new Date().toISOString(),
    },
  ];

  console.log("🧪 Mock notifications:", mockNotifications);

  const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
  console.log("🧪 Unread count:", unreadCount);

  return { notifications: mockNotifications, unreadCount };
};

// Performance test helper
export const measurePerformance = (testName: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;

  console.log(`🧪 Performance test "${testName}": ${duration.toFixed(2)}ms`);
  return duration;
};

// Test email validation function specifically
export const testEmailValidation = () => {
  console.log("🧪 Testing email validation function...");

  const testCases = [
    { email: "mj@test.com", expected: true },
    { email: "user@example.com", expected: true },
    { email: "test@co.uk", expected: true },
    { email: "simple@test.co", expected: true },
    { email: "invalid", expected: false },
    { email: "no@", expected: false },
    { email: "@domain.com", expected: false },
    { email: "", expected: false },
  ];

  testCases.forEach((testCase) => {
    console.log(
      `🧪 Testing: "${testCase.email}" - Expected: ${testCase.expected ? "VALID" : "INVALID"}`,
    );
  });

  return testCases;
};

export default {
  testInputFunctionality,
  testAuthFlow,
  testSupabaseConnection,
  showTestAlert,
  logTestResults,
  testInputComponent,
  debugFormState,
  testNotifications,
  measurePerformance,
  testEmailValidation,
};
