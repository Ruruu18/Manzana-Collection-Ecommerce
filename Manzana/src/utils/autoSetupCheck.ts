import { APP_CONFIG } from '../constants/theme';
import { testSupabaseConnection } from './testConnection';
import verifySetup from './setupVerification';
import { validateEmail, validatePassword } from './index';

// Comprehensive auto-setup check that runs on app start
export const runAutoSetupCheck = async () => {
  console.log('\n🚀 MANZANA REGISTRATION SETUP CHECK');
  console.log('====================================');
  
  try {
    // 1. Quick credential check
    const hasCredentials = !!(
      APP_CONFIG.API_URL &&
      APP_CONFIG.API_KEY &&
      APP_CONFIG.API_URL.includes('supabase.co')
    );

    console.log('📋 Configuration Status:');
    console.log(`  ✅ API URL: ${APP_CONFIG.API_URL ? 'Set' : '❌ Missing'}`);
    console.log(`  ✅ API Key: ${APP_CONFIG.API_KEY ? 'Set' : '❌ Missing'}`);
    console.log(`  ✅ Valid Config: ${hasCredentials ? '✅ Yes' : '❌ No'}`);

    // 2. Test validation functions
    console.log('\n🔍 Validation Tests:');
    
    const testEmails = [
      'test@example.com',
      'user@gmail.com', 
      'mj@test.com',
      'invalid-email'
    ];
    
    testEmails.forEach(email => {
      const isValid = validateEmail(email);
      console.log(`  📧 ${email}: ${isValid ? '✅' : '❌'}`);
    });

    const testPasswords = [
      'test123',
      'password',
      '12345'
    ];
    
    testPasswords.forEach(password => {
      const result = validatePassword(password);
      console.log(`  🔒 "${password}": ${result.isValid ? '✅' : '❌'} ${!result.isValid ? `(${result.errors[0]})` : ''}`);
    });

    // 3. Network connectivity test
    console.log('\n🌐 Network Tests:');
    
    if (hasCredentials) {
      try {
        const connectionResult = await testSupabaseConnection();
        console.log(`  📡 Supabase Connection: ${connectionResult.success ? '✅ Success' : '❌ Failed'}`);
        if (!connectionResult.success) {
          console.log(`     Error: ${connectionResult.error}`);
        }
      } catch (error) {
        console.log(`  📡 Supabase Connection: ❌ Error testing connection`);
      }
    } else {
      console.log('  📡 Supabase Connection: ⚠️ Skipped (no credentials)');
    }

    // 4. Overall assessment
    console.log('\n📊 Overall Assessment:');
    
    if (hasCredentials) {
      console.log('  🎉 Status: READY FOR TESTING');
      console.log('  💡 You can now test user registration');
      console.log('  📱 Try registering with: test@example.com / test123');
    } else {
      console.log('  ⚠️ Status: USING DEVELOPMENT MODE');
      console.log('  🔧 Registration will use mock data');
      console.log('  💡 To test real registration:');
      console.log('     1. Get your Supabase project URL and anon key');
      console.log('     2. Update APP_CONFIG in src/constants/theme.ts');
      console.log('     3. Restart the app');
    }

    // 5. Detailed setup verification (optional)
    if (hasCredentials) {
      console.log('\n🔬 Running detailed verification...');
      try {
        const setupStatus = await verifySetup();
        console.log(`  📋 Setup Status: ${setupStatus.overall.toUpperCase()}`);
        
        if (setupStatus.overall === 'error') {
          console.log('  ❌ Issues found:');
          setupStatus.recommendations.forEach(rec => {
            console.log(`     • ${rec}`);
          });
        }
      } catch (error) {
        console.log('  ⚠️ Detailed verification failed');
      }
    }

    console.log('\n====================================');
    console.log('🏁 Setup check complete!\n');

  } catch (error) {
    console.error('💥 Setup check failed:', error);
  }
};

// Auto-run in development mode (DISABLED - setup is working)
// if (__DEV__) {
//   setTimeout(runAutoSetupCheck, 3000);
// }

export default runAutoSetupCheck;
