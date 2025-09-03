/**
 * Check database state for debugging
 * This will help us see what's actually in the database
 */

const SUPABASE_URL = 'https://enxdypnlbcltrjuepldk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGR5cG5sYmNsdHJqdWVwbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA2NTIsImV4cCI6MjA3MTk1NjY1Mn0.7M37KV8MD6o9N3cxPw3etYbBfm_j1IU2lsLmZMz3viI';

async function checkUsersTable() {
  console.log('🔍 Checking users table...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,created_at&order=created_at.desc&limit=10`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      const users = await response.json();
      console.log('📊 Recent users in database:');
      
      if (users.length === 0) {
        console.log('   • No users found in database');
      } else {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Name: ${user.full_name}`);
          console.log(`      Created: ${user.created_at}`);
          console.log('');
        });
      }
      
      return users;
    } else {
      console.log('❌ Failed to fetch users:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Error checking users table:', error.message);
  }
  
  return [];
}

async function checkAuthUsers() {
  console.log('\n🔍 Checking auth.users table...');
  
  try {
    // Note: This might not work with anon key, but let's try
    const response = await fetch(`${SUPABASE_URL}/rest/v1/auth.users?select=id,email,created_at&order=created_at.desc&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      const authUsers = await response.json();
      console.log('📊 Recent auth users:');
      
      if (authUsers.length === 0) {
        console.log('   • No auth users found (or no permission)');
      } else {
        authUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Created: ${user.created_at}`);
          console.log('');
        });
      }
    } else {
      console.log('⚠️ Cannot access auth.users (expected - need higher permissions)');
    }
  } catch (error) {
    console.log('⚠️ Cannot access auth.users:', error.message);
  }
}

async function testProfileCreation() {
  console.log('\n🧪 Testing profile creation logic...');
  
  const testUserId = 'test-user-' + Date.now();
  
  try {
    // Simulate the check-then-create pattern
    console.log('1. Checking if profile exists...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${testUserId}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    const existingProfiles = await checkResponse.json();
    console.log('   Result:', existingProfiles.length > 0 ? 'Profile exists' : 'No profile found');
    
    if (existingProfiles.length === 0) {
      console.log('2. Creating new profile...');
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: testUserId,
          email: 'test@example.com',
          full_name: 'Test User',
          user_type: 'consumer',
          notification_preferences: {
            push_promotions: true,
            push_stock_alerts: true,
            push_new_products: true,
            email_promotions: true,
            email_stock_alerts: true
          },
          is_active: true
        })
      });
      
      if (createResponse.ok) {
        const newProfile = await createResponse.json();
        console.log('   ✅ Profile created successfully');
        
        // Clean up test profile
        console.log('3. Cleaning up test profile...');
        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${testUserId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        console.log('   ✅ Test profile cleaned up');
        
      } else {
        const errorText = await createResponse.text();
        console.log('   ❌ Profile creation failed:', createResponse.status);
        console.log('   Error:', errorText);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Database State Check\n');
  
  await checkUsersTable();
  await checkAuthUsers();
  await testProfileCreation();
  
  console.log('\n✅ Database check complete!');
  console.log('\n📋 If you see duplicate key errors:');
  console.log('1. Check if there are orphaned profiles in the users table');
  console.log('2. Make sure you deleted the user from BOTH auth.users AND public.users');
  console.log('3. Try creating a fresh test account with a new email');
}

main().catch(console.error);

