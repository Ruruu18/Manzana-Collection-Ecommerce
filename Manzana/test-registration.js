/**
 * Test script to verify registration fixes
 * Run this with: node test-registration.js
 */

const SUPABASE_URL = 'https://enxdypnlbcltrjuepldk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGR5cG5sYmNsdHJqdWVwbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA2NTIsImV4cCI6MjA3MTk1NjY1Mn0.7M37KV8MD6o9N3cxPw3etYbBfm_j1IU2lsLmZMz3viI';

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connectivity
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      console.log('✅ Supabase connection successful');
      
      // Test 2: Check users table access
      const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (usersResponse.ok) {
        console.log('✅ Users table accessible');
      } else {
        console.log('⚠️ Users table access issue:', usersResponse.status, usersResponse.statusText);
      }

      // Test 3: Test auth endpoint
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (authResponse.ok) {
        console.log('✅ Auth endpoint accessible');
      } else {
        console.log('⚠️ Auth endpoint issue:', authResponse.status, authResponse.statusText);
      }

    } else {
      console.log('❌ Supabase connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

async function testRegistration() {
  console.log('\n🔄 Testing user registration...');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          full_name: 'Test User',
          user_type: 'consumer',
        },
      }),
    });

    const responseText = await response.text();
    console.log('Registration response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Registration test successful');
      const data = JSON.parse(responseText);
      console.log('User created with ID:', data.user?.id);
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if user profile was created
      if (data.user?.id) {
        const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${data.user.id}`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${data.access_token || SUPABASE_ANON_KEY}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.length > 0) {
            console.log('✅ User profile created successfully');
            console.log('Profile data:', {
              id: profileData[0].id,
              email: profileData[0].email,
              full_name: profileData[0].full_name,
              user_type: profileData[0].user_type
            });
          } else {
            console.log('⚠️ User profile not found');
          }
        } else {
          console.log('⚠️ Could not check user profile:', profileResponse.status);
        }
      }
      
    } else {
      console.log('❌ Registration test failed');
      console.log('Error response:', responseText);
    }
  } catch (error) {
    console.log('❌ Registration test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase tests...\n');
  
  await testSupabaseConnection();
  await testRegistration();
  
  console.log('\n🎉 Tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the COMPLETE_DATABASE_FIX.sql script in your Supabase SQL Editor');
  console.log('2. Test registration in your mobile app');
  console.log('3. Check that profile data loads correctly in Profile and EditProfile screens');
}

runTests().catch(console.error);
