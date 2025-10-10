/**
 * Network utilities for React Native
 * Helps diagnose and fix network request issues
 */

import { Platform } from 'react-native';

// Simple network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a simple endpoint
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Enhanced fetch wrapper for React Native
export const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  console.log('🔄 Enhanced fetch:', url);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Add user agent for React Native
      'User-Agent': Platform.OS === 'ios' ? 'ManzanaApp/iOS' : 'ManzanaApp/Android',
      ...options.headers,
    },
    // Add timeout to prevent hanging requests
    // @ts-ignore - timeout is supported in React Native
    timeout: 10000,
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    console.log('✅ Fetch response:', response.status, response.statusText);
    return response;
  } catch (error: any) {
    console.error('❌ Enhanced fetch failed:', error.message);
    
    // Provide more specific error information
    if (error.message?.includes('Network request failed')) {
      console.error('❌ Network request failed - possible causes:');
      console.error('  • No internet connection');
      console.error('  • Server is unreachable');
      console.error('  • CORS or security policy blocking request');
      console.error('  • SSL/TLS certificate issues');
    }
    
    throw error;
  }
};

// Network diagnostics
export const runNetworkDiagnostics = async () => {
  console.log('🔍 Running network diagnostics...');
  
  const results = {
    basicConnectivity: false,
    httpsSupport: false,
    supabaseReachable: false,
  };

  // Test 1: Basic connectivity
  try {
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      // @ts-ignore
      timeout: 5000 
    });
    results.basicConnectivity = response.ok;
    console.log('✅ Basic connectivity:', results.basicConnectivity);
  } catch (error) {
    console.log('❌ Basic connectivity failed:', error);
  }

  // Test 2: HTTPS support
  try {
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      // @ts-ignore
      timeout: 5000 
    });
    results.httpsSupport = response.ok;
    console.log('✅ HTTPS support:', results.httpsSupport);
  } catch (error) {
    console.log('❌ HTTPS support failed:', error);
  }

  // Test 3: Supabase reachability
  try {
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXN3ZXJhZGN5bnBiZ2Fyd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTQ2MzcsImV4cCI6MjA3MzE3MDYzN30.bEUieVgxnM1xaBgMaj8AM07vSbdKP_Ti_pWKUGULXzI';
    
    const response = await fetch('https://fuqsweradcynpbgarwoc.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // @ts-ignore
      timeout: 5000,
    });
    results.supabaseReachable = response.ok;
    console.log('✅ Supabase reachable:', results.supabaseReachable, 'Status:', response.status);
  } catch (error) {
    console.log('❌ Supabase not reachable:', error);
  }

  console.log('🔍 Network diagnostics complete:', results);
  return results;
};
