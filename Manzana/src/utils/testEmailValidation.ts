import { validateEmail } from './index';

// Simple test function to verify email validation
export const testEmailValidation = () => {
  console.log("🧪 Starting Email Validation Tests...");

  const testCases = [
    { email: "mj@test.com", expected: true, description: "Simple test email" },
    { email: "user@example.com", expected: true, description: "Standard email" },
    { email: "test@test.co", expected: true, description: "Short domain" },
    { email: "a@b.c", expected: true, description: "Minimal valid email" },
    { email: "john.doe@company.org", expected: true, description: "With dots and org" },
    { email: "test123@domain.net", expected: true, description: "With numbers" },
    { email: "invalid", expected: false, description: "No @ symbol" },
    { email: "no@", expected: false, description: "No domain" },
    { email: "@domain.com", expected: false, description: "No username" },
    { email: "", expected: false, description: "Empty string" },
    { email: "   ", expected: false, description: "Only spaces" },
    { email: "test@", expected: false, description: "Missing domain" },
    { email: "test@domain", expected: false, description: "No TLD" },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = validateEmail(testCase.email);
    const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";

    console.log(`Test ${index + 1}: ${status} - "${testCase.email}" (${testCase.description})`);
    console.log(`  Expected: ${testCase.expected}, Got: ${result}`);

    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log(`\n🧪 Email Validation Test Results:`);
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);

  // Special test for the problematic email
  console.log(`\n🔍 Special test for "mj@test.com":`);
  const mjTestResult = validateEmail("mj@test.com");
  console.log(`Result: ${mjTestResult}`);
  console.log(`Should be: true`);

  if (mjTestResult) {
    console.log("✅ mj@test.com validation PASSED - registration should work!");
  } else {
    console.log("❌ mj@test.com validation FAILED - this needs to be fixed!");
  }

  return {
    totalTests: testCases.length,
    passed,
    failed,
    mjTestPassed: mjTestResult,
    allPassed: failed === 0
  };
};

// Run test immediately when imported (for debugging)
if (__DEV__) {
  console.log("🧪 Auto-running email validation test...");
  setTimeout(() => {
    testEmailValidation();
  }, 1000);
}

export default testEmailValidation;
