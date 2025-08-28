import { supabase, isDevMode } from '../services/supabase';
import { APP_CONFIG } from '../constants/theme';
import { validateEmail, validatePassword } from './index';
import { debugLog, ENVIRONMENT_CHECKS, VALIDATION_TEST_CASES } from '../constants/debug';

export interface SetupStatus {
  overall: 'success' | 'warning' | 'error';
  checks: {
    supabaseConnection: boolean;
    credentials: boolean;
    emailValidation: boolean;
    passwordValidation: boolean;
    databaseAccess: boolean;
    authFlow: boolean;
  };
  messages: string[];
  recommendations: string[];
}

export const verifySetup = async (): Promise<SetupStatus> => {
  const status: SetupStatus = {
    overall: 'success',
    checks: {
      supabaseConnection: false,
      credentials: false,
      emailValidation: false,
      passwordValidation: false,
      databaseAccess: false,
      authFlow: false,
    },
    messages: [],
    recommendations: [],
  };

  debugLog.info('🔍 Starting setup verification...');

  // Check 1: Supabase Credentials
  try {
    const hasCredentials = ENVIRONMENT_CHECKS.hasSupabaseCredentials();
    status.checks.credentials = hasCredentials;

    if (hasCredentials) {
      status.messages.push('✅ Supabase credentials found');
      debugLog.success('Supabase credentials are properly configured');
    } else {
      status.messages.push('❌ Supabase credentials missing or invalid');
      status.recommendations.push('Check API_URL and API_KEY in constants/theme.ts');
      status.overall = 'error';
    }
  } catch (error) {
    status.messages.push('❌ Error checking credentials');
    status.recommendations.push('Verify Supabase configuration');
    status.overall = 'error';
  }

  // Check 2: Development Mode Detection
  if (isDevMode) {
    status.messages.push('⚠️  Running in development/mock mode');
    status.recommendations.push('Configure real Supabase credentials to test actual registration');
    if (status.overall === 'success') {
      status.overall = 'warning';
    }
  } else {
    status.messages.push('✅ Connected to real Supabase instance');
  }

  // Check 3: Supabase Connection Test
  try {
    const { data, error } = await supabase.auth.getSession();

    if (!error) {
      status.checks.supabaseConnection = true;
      status.messages.push('✅ Supabase connection test passed');
      debugLog.success('Supabase connection is working');
    } else {
      status.messages.push('❌ Supabase connection test failed');
      status.recommendations.push('Check internet connection and Supabase credentials');
      status.overall = 'error';
    }
  } catch (error) {
    status.checks.supabaseConnection = false;
    status.messages.push('❌ Supabase connection error');
    status.recommendations.push('Verify Supabase configuration and network connectivity');
    status.overall = 'error';
  }

  // Check 4: Email Validation
  try {
    let emailTestsPassed = 0;
    let emailTestsTotal = 0;

    for (const testCase of VALIDATION_TEST_CASES.emails) {
      const result = validateEmail(testCase.email);
      emailTestsTotal++;

      if (result === testCase.expected) {
        emailTestsPassed++;
      } else {
        debugLog.warn(`Email validation failed for: ${testCase.email} (expected: ${testCase.expected}, got: ${result})`);
      }
    }

    const emailPassRate = emailTestsPassed / emailTestsTotal;
    status.checks.emailValidation = emailPassRate >= 0.8; // 80% pass rate

    if (status.checks.emailValidation) {
      status.messages.push(`✅ Email validation working (${emailTestsPassed}/${emailTestsTotal} tests passed)`);
    } else {
      status.messages.push(`❌ Email validation issues (${emailTestsPassed}/${emailTestsTotal} tests passed)`);
      status.recommendations.push('Check email validation logic in utils/index.ts');
      status.overall = 'error';
    }
  } catch (error) {
    status.checks.emailValidation = false;
    status.messages.push('❌ Email validation test failed');
    status.recommendations.push('Fix email validation function');
    status.overall = 'error';
  }

  // Check 5: Password Validation
  try {
    let passwordTestsPassed = 0;
    let passwordTestsTotal = 0;

    for (const testCase of VALIDATION_TEST_CASES.passwords) {
      const result = validatePassword(testCase.password);
      passwordTestsTotal++;

      if (result.isValid === testCase.expected) {
        passwordTestsPassed++;
      } else {
        debugLog.warn(`Password validation failed for: ${testCase.password} (expected: ${testCase.expected}, got: ${result.isValid})`);
      }
    }

    const passwordPassRate = passwordTestsPassed / passwordTestsTotal;
    status.checks.passwordValidation = passwordPassRate >= 0.8;

    if (status.checks.passwordValidation) {
      status.messages.push(`✅ Password validation working (${passwordTestsPassed}/${passwordTestsTotal} tests passed)`);
    } else {
      status.messages.push(`❌ Password validation issues (${passwordTestsPassed}/${passwordTestsTotal} tests passed)`);
      status.recommendations.push('Check password validation logic in utils/index.ts');
      status.overall = 'error';
    }
  } catch (error) {
    status.checks.passwordValidation = false;
    status.messages.push('❌ Password validation test failed');
    status.recommendations.push('Fix password validation function');
    status.overall = 'error';
  }

  // Check 6: Database Access (only if not in dev mode)
  if (!isDevMode) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (!error) {
        status.checks.databaseAccess = true;
        status.messages.push('✅ Database access working');
        debugLog.success('Can access users table');
      } else {
        status.messages.push('❌ Database access failed');
        status.recommendations.push('Check RLS policies and table permissions in Supabase');
        status.overall = 'error';
      }
    } catch (error) {
      status.checks.databaseAccess = false;
      status.messages.push('❌ Database access error');
      status.recommendations.push('Verify database setup and run the SQL configuration script');
      status.overall = 'error';
    }
  } else {
    status.checks.databaseAccess = true; // Skip in dev mode
    status.messages.push('⚠️  Database access check skipped (dev mode)');
  }

  // Check 7: Auth Flow Test (basic)
  try {
    // Test if we can call auth functions without errors
    const testEmail = 'test@example.com';
    const testPassword = 'testpass123';

    // This shouldn't actually create a user, just test the flow
    debugLog.info('Testing auth flow (dry run)...');

    // Test sign up validation
    const emailValid = validateEmail(testEmail);
    const passwordValid = validatePassword(testPassword).isValid;

    if (emailValid && passwordValid) {
      status.checks.authFlow = true;
      status.messages.push('✅ Auth flow validation working');
    } else {
      status.messages.push('❌ Auth flow validation failed');
      status.recommendations.push('Check email/password validation in auth flow');
      status.overall = 'error';
    }
  } catch (error) {
    status.checks.authFlow = false;
    status.messages.push('❌ Auth flow test failed');
    status.recommendations.push('Check authentication hook implementation');
    status.overall = 'error';
  }

  // Final assessment
  const passedChecks = Object.values(status.checks).filter(Boolean).length;
  const totalChecks = Object.keys(status.checks).length;

  debugLog.info(`Setup verification completed: ${passedChecks}/${totalChecks} checks passed`);

  if (passedChecks === totalChecks && status.overall !== 'error') {
    status.overall = isDevMode ? 'warning' : 'success';
  }

  // Add configuration recommendations
  if (isDevMode) {
    status.recommendations.push('To test real registration: Configure Supabase credentials in constants/theme.ts');
  }

  if (status.overall === 'error') {
    status.recommendations.push('Run the SQL configuration script in your Supabase dashboard');
    status.recommendations.push('Check Supabase auth settings: disable email confirmation');
  }

  return status;
};

// Quick setup check for debugging
export const quickSetupCheck = (): void => {
  console.log('\n🔍 QUICK SETUP CHECK');
  console.log('==================');
  console.log(`Environment: ${__DEV__ ? 'Development' : 'Production'}`);
  console.log(`Supabase Mode: ${isDevMode ? 'Mock/Dev' : 'Real'}`);
  console.log(`Has Credentials: ${ENVIRONMENT_CHECKS.hasSupabaseCredentials()}`);
  console.log(`API URL: ${APP_CONFIG.API_URL ? 'Set' : 'Missing'}`);
  console.log(`API Key: ${APP_CONFIG.API_KEY ? 'Set' : 'Missing'}`);

  // Test email validation
  const testEmail = 'test@example.com';
  const emailValid = validateEmail(testEmail);
  console.log(`Email Validation Test: ${emailValid ? 'PASS' : 'FAIL'} (${testEmail})`);

  // Test password validation
  const testPassword = 'test123';
  const passwordValid = validatePassword(testPassword).isValid;
  console.log(`Password Validation Test: ${passwordValid ? 'PASS' : 'FAIL'} (${testPassword})`);

  console.log('==================\n');
};

// Auto-run quick check in development (DISABLED - setup is working)
// if (__DEV__) {
//   setTimeout(quickSetupCheck, 2000);
// }

export default verifySetup;
