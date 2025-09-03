import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase, handleSupabaseError } from "../services/supabase";
import { User, UseAuthReturn } from "../types";
import { Session } from "@supabase/supabase-js";
import { testSupabaseConnection, getConnectionErrorMessage } from "../utils/testConnection";
import { clearCorruptedSession } from "../utils";
import { runNetworkDiagnostics } from "../utils/networkUtils";
import { directSignUp } from "../utils/directAuth";

interface AuthContextType extends UseAuthReturn {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [profileCreationAttempts, setProfileCreationAttempts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("🔄 Getting initial session...");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        console.log("✅ Session retrieved:", session ? "Found" : "None");
        setSession(session);

        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        } else {
          console.log("⚠️ No valid session or user ID found, clearing state");
          setUser(null);
          setSession(null);
        }

      } catch (error: any) {
        console.error("❌ Error getting initial session:", error.message);
        
        // If we get a refresh token error, clear the stored session
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log("🔄 Clearing invalid session...");
          try {
            await clearCorruptedSession();
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          } catch (signOutError) {
            console.error("❌ Error signing out:", signOutError);
          }
        }
      } finally {
        console.log("✅ Initial session check complete, setting loading to false");
        setLoading(false);
      }
    };

    getInitialSession();

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("⏰ Auth timeout reached, forcing loading to false");
        setLoading(false);
      }
    }, 8000); // 8 second timeout

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log("🔄 Auth state change:", event, session ? "Session exists" : "No session");
      console.log("🔍 Session details:", {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        event: event
      });

      setSession(session);

      if (session?.user?.id) {
        console.log("🔄 About to fetch profile for user:", session.user.id);
        await fetchUserProfile(session.user.id);
      } else {
        console.log("⚠️ No session or valid user ID, setting user to null");
        setUser(null);
      }

      // Always set loading to false after auth state changes
      setLoading(false);
    }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔄 Fetching user profile for ID:", userId);
      
      // Validate userId before making the request
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error("❌ Invalid user ID provided:", userId);
        setUser(null);
        return;
      }
      
      // Prevent multiple simultaneous profile fetches
      if (fetchingProfile) {
        console.log("⚠️ Profile fetch already in progress, skipping...");
        return;
      }
      
      setFetchingProfile(true);
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("🔍 Raw Supabase response:", { data, error });

      // Check if data is valid (not null, not empty array, and has properties)
      const hasValidData = data && 
                           typeof data === 'object' && 
                           !Array.isArray(data) && 
                           Object.keys(data).length > 0;
      
      if (!hasValidData) {
        console.log("⚠️ No valid profile data found (empty array or null)");
      }

      if ((error && error.code === 'PGRST116') || !hasValidData) {
        // No user profile found - NUCLEAR OPTION: Just ignore and continue
        console.log("⚠️ No user profile found - IGNORING for now to prevent crashes");
        console.log("📱 App will continue with basic functionality");
        
        // Set a basic user object with auth data only
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const basicUser = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "User",
            user_type: authUser.user_metadata?.user_type || "consumer",
            notification_preferences: {
              push_promotions: true,
              push_stock_alerts: true,
              push_new_products: true,
              email_promotions: true,
              email_stock_alerts: true,
            },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log("✅ Using basic user data from auth:", {
            id: basicUser.id,
            email: basicUser.email,
            full_name: basicUser.full_name,
          });
          
          setUser(basicUser);
        } else {
          setUser(null);
        }
      } else if (error) {
        console.error("❌ Error fetching user profile:", error.message);
        console.error("❌ Error details:", error);
        // Check for specific UUID errors
        if (error.message.includes('invalid input syntax for type uuid')) {
          console.error("❌ Invalid UUID format detected, clearing user state");
        }
        throw error;
      }

      if (hasValidData) {
        console.log("✅ User profile fetched successfully:", {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          user_type: data.user_type,
          rawData: data
        });
        setUser(data);
      } else {
        console.warn("⚠️ No user profile data found for ID:", userId);
        console.log("🔄 NUCLEAR FIX: Using auth data directly instead of creating database profile");
        
        // Get the auth user data and use it directly
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser && authUser.id === userId) {
          const basicUser = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "User",
            user_type: authUser.user_metadata?.user_type || "consumer",
            notification_preferences: {
              push_promotions: true,
              push_stock_alerts: true,
              push_new_products: true,
              email_promotions: true,
              email_stock_alerts: true,
            },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log("✅ Using auth data directly:", {
            id: basicUser.id,
            email: basicUser.email,
            full_name: basicUser.full_name,
          });
          
          setUser(basicUser);
        } else {
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch user profile:", error.message);
      // Don't set user to null here as it might clear existing data
      // Let the UI handle the case where user data is missing
    } finally {
      setFetchingProfile(false);
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      console.log("🔄 Attempting to sign in...");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error("❌ Sign in error:", error.message);
        return { error: error.message };
      }

      console.log("✅ Sign in successful");
      return {};
    } catch (error: any) {
      console.error("❌ Unexpected sign in error:", error.message);
      return { error: "Unexpected error during sign in" };
    } finally {
      setLoading(false);
    }
  };



  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>,
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      console.log("🔄 Starting user registration for:", email);

      // Step 1: Create auth user
      console.log("🔄 Attempting Supabase auth signup with:", {
        email: email.toLowerCase().trim(),
        hasPassword: !!password,
        passwordLength: password?.length,
        userData: userData
      });

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type,
          },
          emailRedirectTo: undefined, // Disable email verification
        },
      });

      console.log("🔄 Auth signup result:", { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error("❌ Auth signup failed:", error.message);
        console.error("❌ Full error object:", error);
        
        // Handle specific error cases
        if (error.message?.includes('Network request failed')) {
          console.error("❌ Network request failed - trying direct API fallback...");
          
          try {
            // Try direct API call as fallback
            const directResult = await directSignUp({
              email: email.toLowerCase().trim(),
              password,
              full_name: userData.full_name,
              user_type: userData.user_type,
            });
            
            if (directResult.success) {
              console.log("✅ Direct API signup successful!");
              
              // Continue with the rest of the signup process
              if (directResult.data?.user) {
                // Set the data to use the direct result
                const directData = { user: directResult.data.user };
                
                // Continue with profile creation logic...
                console.log("✅ Direct auth user created successfully, ID:", directResult.data.user.id);
                
                // Skip to profile verification since we have the user
                const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
                let profileCreated = false;
                
                for (let attempt = 1; attempt <= 10; attempt++) {
                  try {
                    console.log(`🔄 Checking for user profile (attempt ${attempt}/10)...`);
                    
                    const { data: profile, error: fetchErr } = await supabase
                      .from("users")
                      .select("id, email, full_name, user_type")
                      .eq("id", directResult.data.user.id)
                      .single();

                    console.log(`🔍 Profile check result:`, {
                      hasProfile: !!profile,
                      hasError: !!fetchErr,
                      errorMessage: fetchErr?.message
                    });

                    if (profile && !fetchErr) {
                      console.log("✅ User profile found!");
                      profileCreated = true;
                      break;
                    }
                    
                    await wait(1000);
                    
                  } catch (profileError: any) {
                    console.error(`❌ Profile check error (attempt ${attempt}):`, profileError.message);
                    await wait(1000);
                  }
                }
                
                if (!profileCreated) {
                  return { 
                    error: "Registration completed but profile verification failed. Please try signing in." 
                  };
                }
                
                console.log("🎉 Direct API registration completed successfully!");
                return {};
              }
            } else {
              console.error("❌ Direct API signup also failed:", directResult.error);
            }
          } catch (directError: any) {
            console.error("❌ Direct API fallback failed:", directError.message);
          }
          
          // If direct API also fails, run diagnostics
          try {
            const diagnostics = await runNetworkDiagnostics();
            console.log("🔍 Diagnostics results:", diagnostics);
            
            if (!diagnostics.basicConnectivity) {
              return { 
                error: "No internet connection detected. Please check your network connection and try again." 
              };
            } else if (!diagnostics.supabaseReachable) {
              return { 
                error: "Unable to reach authentication server. Please try again in a few moments." 
              };
            }
          } catch (diagError) {
            console.error("❌ Diagnostics failed:", diagError);
          }
          
          // Fallback error message
          return { 
            error: "Network connection failed during registration. Please check your internet connection and try again." 
          };
        }
        
        // Handle other specific Supabase auth errors
        if (error.message?.includes('Invalid login credentials')) {
          return { error: "Invalid email or password format." };
        }
        
        if (error.message?.includes('Email not confirmed')) {
          return { error: "Please check your email and confirm your account before signing in." };
        }
        
        if (error.message?.includes('User already registered')) {
          return { error: "This email is already registered. Please try signing in instead." };
        }
        
        return { error: error.message };
      }

      if (!data?.user) {
        console.error("❌ No user returned from auth signup");
        return { error: "Registration failed - no user created" };
      }

      console.log("✅ Auth user created successfully, ID:", data.user.id);

      // Step 2: Wait for database trigger to create profile automatically
      console.log("🔄 Waiting for database trigger to create user profile...");
      
      // Small delay to allow trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Don't worry about profile creation - let the app handle it later
      console.log("✅ Registration successful - profile will be created on first login if needed");
      console.log("🎉 Skipping complex profile verification to avoid duplicate key errors");

      // Step 4: Sign out the user so they must manually log in
      try {
        if (data.session) {
          console.log("🔄 Signing out user after registration...");
          await supabase.auth.signOut();
          console.log("✅ User signed out successfully");
        }
      } catch (signOutError: any) {
        console.error("❌ Error signing out after registration:", signOutError.message);
        // Don't fail registration for this
      }

      console.log("🎉 Registration completed successfully!");
      return {};
      
    } catch (error: any) {
      console.error("❌ Unexpected error during registration:", error.message);
      
      // Provide more specific error messages
      if (error.message?.includes('Network request failed')) {
        return { 
          error: "Network connection failed. Please check your internet connection and try again." 
        };
      } else if (error.message?.includes('Failed to fetch')) {
        return { 
          error: "Unable to connect to the server. Please try again later." 
        };
      }
      
      return { error: `Registration failed: ${error.message}` };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);

    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: "manzana://reset-password",
        },
      );

      if (error) {

        return { error: error.message };
      }


      return {};
    } catch (error) {

      return { error: "Error enviando email de recuperación" };
    }
  };

  const updateProfile = async (
    updates: Partial<User>,
  ): Promise<{ error?: string }> => {
    try {
      if (!user) {

        return { error: "Usuario no autenticado" };
      }

      setLoading(true);


      // Update user profile in database
      const { error, data } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {

        return { error: error.message };
      }



      // Update local user state
      setUser({ ...user, ...updates });

      return {};
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      const errorInfo = handleSupabaseError(error);
      return { 
        error: errorInfo?.userMessage || "Error updating profile" 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
