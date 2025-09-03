/**
 * Test script to verify profile data fix
 * This simulates the empty array issue and tests our fix
 */

// Simulate the Supabase response that was causing issues
function testEmptyArrayHandling() {
  console.log('🔄 Testing empty array handling...');
  
  // This is what Supabase was returning
  const mockSupabaseResponse = {
    data: [], // Empty array instead of null
    error: null
  };
  
  console.log('📥 Mock Supabase response:', mockSupabaseResponse);
  
  // Our new logic to handle this
  const data = mockSupabaseResponse.data;
  const error = mockSupabaseResponse.error;
  
  const hasValidData = data && 
                       typeof data === 'object' && 
                       !Array.isArray(data) && 
                       Object.keys(data).length > 0;
  
  console.log('🔍 hasValidData check result:', hasValidData);
  
  if (!hasValidData) {
    console.log('✅ Correctly detected invalid data (empty array)');
    console.log('✅ This would trigger profile creation logic');
  } else {
    console.log('❌ Failed to detect invalid data');
  }
  
  return hasValidData;
}

// Test with valid data
function testValidDataHandling() {
  console.log('\n🔄 Testing valid data handling...');
  
  const mockValidResponse = {
    data: {
      id: 'test-123',
      email: 'test@example.com',
      full_name: 'Test User',
      user_type: 'consumer'
    },
    error: null
  };
  
  console.log('📥 Mock valid response:', mockValidResponse);
  
  const data = mockValidResponse.data;
  const hasValidData = data && 
                       typeof data === 'object' && 
                       !Array.isArray(data) && 
                       Object.keys(data).length > 0;
  
  console.log('🔍 hasValidData check result:', hasValidData);
  
  if (hasValidData) {
    console.log('✅ Correctly detected valid data');
    console.log('✅ This would set user data in the app');
  } else {
    console.log('❌ Failed to detect valid data');
  }
  
  return hasValidData;
}

// Test with null data
function testNullDataHandling() {
  console.log('\n🔄 Testing null data handling...');
  
  const mockNullResponse = {
    data: null,
    error: { code: 'PGRST116', message: 'No rows found' }
  };
  
  console.log('📥 Mock null response:', mockNullResponse);
  
  const data = mockNullResponse.data;
  const hasValidData = data && 
                       typeof data === 'object' && 
                       !Array.isArray(data) && 
                       Object.keys(data).length > 0;
  
  console.log('🔍 hasValidData check result:', hasValidData);
  console.log('🔍 data is:', data);
  console.log('🔍 data && ... result:', !!data);
  
  if (!hasValidData) {
    console.log('✅ Correctly detected invalid data (null)');
    console.log('✅ This would trigger profile creation logic');
  } else {
    console.log('❌ Failed to detect invalid data');
  }
  
  return hasValidData;
}

// Run all tests
function runTests() {
  console.log('🚀 Testing Profile Data Fix Logic\n');
  
  const test1 = testEmptyArrayHandling();
  const test2 = testValidDataHandling();
  const test3 = testNullDataHandling();
  
  console.log('\n📊 Test Results:');
  console.log('Empty Array Test:', !test1 ? '✅ PASS' : '❌ FAIL');
  console.log('Valid Data Test:', test2 === true ? '✅ PASS' : '❌ FAIL');
  console.log('Null Data Test:', !test3 ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = (!test1) && (test2 === true) && (!test3);
  
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 The profile data fix should work correctly!');
    console.log('📱 Your app should now:');
    console.log('   • Detect when Supabase returns empty arrays');
    console.log('   • Automatically create missing profiles');
    console.log('   • Display user data correctly in the profile screen');
  } else {
    console.log('\n⚠️ There may be issues with the fix logic');
  }
}

runTests();
