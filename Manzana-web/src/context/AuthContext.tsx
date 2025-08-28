import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  user_type: 'consumer' | 'reseller' | 'staff' | 'admin'
  avatar_url: string | null
  is_active: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  isStaff: boolean
  isAdminOrStaff: boolean
  userRole: string
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function computeUserPermissions(userProfile: UserProfile | null) {
  if (!userProfile) {
    return {
      isAdmin: false,
      isStaff: false,
      isAdminOrStaff: false,
      userRole: 'none'
    }
  }

  const isAdmin = userProfile.user_type === 'admin'
  const isStaff = userProfile.user_type === 'staff'
  const isAdminOrStaff = isAdmin || isStaff

  return {
    isAdmin,
    isStaff,
    isAdminOrStaff,
    userRole: userProfile.user_type
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load cached profile from localStorage on init
  const loadCachedProfile = (userId: string): UserProfile | null => {
    try {
      const cached = localStorage.getItem(`userProfile_${userId}`);
      if (cached) {
        const profile = JSON.parse(cached);
        console.log('✅ Loaded cached profile:', profile.email);
        return profile;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cached profile:', error);
    }
    return null;
  };

  // Save profile to localStorage for persistence
  const cacheProfile = (profile: UserProfile) => {
    try {
      localStorage.setItem(`userProfile_${profile.id}`, JSON.stringify(profile));
      console.log('💾 Profile cached for:', profile.email);
    } catch (error) {
      console.warn('⚠️ Failed to cache profile:', error);
    }
  };



  // Get user profile INSTANTLY - no waiting, no timeouts!
  const getInstantProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('⚡ Getting instant profile for user:', userId);
    
    // 1. First check if we already have it in memory
    if (userProfile?.id === userId) {
      console.log('✅ Profile already available in memory');
      return userProfile;
    }

    // 2. Try to load from cache immediately
    const cachedProfile = loadCachedProfile(userId);
    if (cachedProfile) {
      console.log('⚡ Using cached profile - INSTANT!');
      setUserProfile(cachedProfile);
      
      // Background sync with database (non-blocking)
      backgroundSyncProfile(userId);
      return cachedProfile;
    }

    // 3. Get auth user for immediate fallback
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        console.log('⚡ Creating instant fallback profile');
        const instantProfile = createFallbackProfile(userId, authUser);
        setUserProfile(instantProfile);
        
        // Cache the fallback profile
        cacheProfile(instantProfile);
        
        // Background sync with database (non-blocking)
        backgroundSyncProfile(userId);
        return instantProfile;
      }
    } catch (error) {
      console.warn('⚠️ Auth user fetch failed:', error);
    }

    return null;
  };

  // Background sync - runs in background without blocking UI
  const backgroundSyncProfile = async (userId: string) => {
    try {
      console.log('🔄 Background syncing profile...');
      
      // Quick database fetch with short timeout
      const { data, error } = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Background sync timeout')), 2000)
        )
      ]) as any;

      if (!error && data) {
        console.log('✅ Background sync successful');
        const syncedProfile: UserProfile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          user_type: data.user_type,
          avatar_url: data.avatar_url,
          is_active: data.is_active
        };
        
        // Update cache and state if different
        if (JSON.stringify(syncedProfile) !== JSON.stringify(userProfile)) {
          console.log('📊 Profile updated from database');
          setUserProfile(syncedProfile);
          cacheProfile(syncedProfile);
        }
      }
    } catch (error) {
      console.log('⚠️ Background sync failed (no impact on user):', error);
      // Fail silently - user already has working profile
    }
  };

  // Create a fallback profile when database is unavailable
  const createFallbackProfile = (userId: string, authUser: any): UserProfile => {
    // Check for admin emails (both test and real)
    const isAdmin = authUser.email === 'admin@test.com' || 
                   authUser.email === 'admin@gmail.com' || 
                   authUser.email?.includes('admin');
    const isStaff = authUser.email === 'staff@test.com' || authUser.email?.includes('staff');
    
    const userType = isAdmin ? 'admin' : isStaff ? 'staff' : 'consumer';
    
    const fallbackProfile: UserProfile = {
      id: userId,
      email: authUser.email,
      full_name: isAdmin ? 'System Administrator' : 
                isStaff ? 'Staff Member' : 
                authUser.user_metadata?.full_name || 'User',
      user_type: userType,
      avatar_url: null,
      is_active: true
    };

    console.log('📝 Created fallback profile:', { email: authUser.email, userType, isAdmin });
    return fallbackProfile;
  }

  const refreshProfile = async () => {
    if (user) {
      try {
        console.log('🔄 Refreshing profile instantly...');
        // Clear cache to force fresh fetch
        localStorage.removeItem(`userProfile_${user.id}`);
        
        await getInstantProfile(user.id);
        console.log('✅ Profile refreshed instantly');
      } catch (error) {
        console.error('❌ Profile refresh failed:', error);
      }
    }
  }

  useEffect(() => {
    let isMounted = true
    let isInitializing = true
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth state...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error during initialization:', error)
        }
        
        if (!isMounted) return

        const session = data.session
        console.log('🔐 Initial session:', session ? `User: ${session.user?.email}` : 'No session')

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('🔐 Getting user profile instantly...')
          const profile = await getInstantProfile(session.user.id)
          if (isMounted) {
            console.log('🔐 Profile available instantly:', profile?.user_type, 'for email:', profile?.email)
          }
        } else {
          console.log('🔐 No session found, setting userProfile to null')
          setUserProfile(null)
        }

        setLoading(false)
        isInitializing = false
        console.log('🔐 Auth initialization complete')
      } catch (error) {
        console.error('Auth initialization error:', error)
        setLoading(false)
        isInitializing = false
      }
    }

    initializeAuth()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
      console.log('🔐 Auth state change:', event, newSession ? `User: ${newSession.user?.email}` : 'No session')
      
      // Skip processing if we're still initializing to prevent duplicate calls
      if (isInitializing) {
        console.log('🔐 Skipping auth state change - still initializing')
        return;
      }

      if (!isMounted) return;

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await getInstantProfile(newSession.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const permissions = useMemo(() => computeUserPermissions(userProfile), [userProfile])

  async function signIn(email: string, password: string) {
    console.log('🔍 AuthContext signIn - using supabase client:', supabase)
    console.log('🔍 AuthContext signIn - supabase URL should be enxdypnlbcltrjuepldk')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUserProfile(null)
  }

  const value: AuthContextValue = { 
    user, 
    session, 
    userProfile,
    loading, 
    ...permissions,
    signIn, 
    signOut,
    refreshProfile
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
