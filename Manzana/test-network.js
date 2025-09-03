#!/usr/bin/env node

/**
 * Simple network connectivity test for Supabase
 * Run this to test if your Supabase instance is reachable
 */

const SUPABASE_URL = 'https://enxdypnlbcltrjuepldk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueGR5cG5sYmNsdHJqdWVwbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODA2NTIsImV4cCI6MjA3MTk1NjY1Mn0.7M37KV8MD6o9N3cxPw3etYbBfm_j1IU2lsLmZMz3viI';

async function testConnection() {
    console.log('🔍 Testing Supabase connectivity...');
    console.log('URL:', SUPABASE_URL);
    console.log('');

    // Test 1: Basic HTTP connectivity
    try {
        console.log('1. Testing basic HTTP connectivity...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
        console.log('✅ HTTP Status:', response.status);
        console.log('✅ Basic connectivity: OK');
    } catch (error) {
        console.log('❌ Basic connectivity failed:', error.message);
        return;
    }

    // Test 2: Auth endpoint
    try {
        console.log('');
        console.log('2. Testing Auth endpoint...');
        const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
        
        if (response.ok) {
            const settings = await response.json();
            console.log('✅ Auth endpoint: OK');
            console.log('✅ Sign up enabled:', settings.external_email_enabled !== false);
            console.log('✅ Email confirmation required:', settings.email_confirm_required || false);
        } else {
            console.log('❌ Auth endpoint status:', response.status);
        }
    } catch (error) {
        console.log('❌ Auth endpoint failed:', error.message);
    }

    // Test 3: Sample signup attempt (will fail but we can see the error)
    try {
        console.log('');
        console.log('3. Testing signup endpoint...');
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword123'
            })
        });

        const result = await response.text();
        console.log('✅ Signup endpoint status:', response.status);
        console.log('✅ Response preview:', result.substring(0, 200) + '...');
        
        if (response.status === 400) {
            console.log('✅ Signup endpoint is working (400 = expected validation error)');
        } else if (response.status === 200) {
            console.log('✅ Signup endpoint is working (200 = success)');
        } else {
            console.log('⚠️  Unexpected status code');
        }
    } catch (error) {
        console.log('❌ Signup endpoint failed:', error.message);
        console.log('');
        console.log('🔧 POSSIBLE SOLUTIONS:');
        console.log('1. Check your internet connection');
        console.log('2. Verify Supabase project is not paused');
        console.log('3. Check if your IP is blocked');
        console.log('4. Verify API keys are correct');
        console.log('5. Check Supabase Auth settings');
    }

    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('1. If all tests pass, the issue might be in React Native networking');
    console.log('2. If auth tests fail, check Supabase dashboard settings');
    console.log('3. If signup fails, check Auth > Settings in Supabase dashboard');
}

testConnection();
