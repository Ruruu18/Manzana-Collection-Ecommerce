#!/usr/bin/env node

/**
 * Manual script to clear corrupted Supabase session from AsyncStorage
 * Run this if the app gets stuck on loading due to refresh token errors
 */

const { execSync } = require('child_process');

console.log('🔄 Clearing corrupted Supabase session...');

try {
  // Clear AsyncStorage for the app
  execSync('npx expo r --clear', { stdio: 'inherit' });
  console.log('✅ Successfully cleared app cache and AsyncStorage');
  console.log('🚀 You can now restart the app');
} catch (error) {
  console.error('❌ Error clearing session:', error.message);
  console.log('💡 Try manually clearing the app data in the Android emulator or reinstalling the app');
}
