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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);

        if (session?.user?.id) {
          // Validate session hasn't expired
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);

          if (expiresAt && expiresAt < now) {
            // Session expired, clear it
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }

          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setSession(null);
        }

      } catch (error: any) {

        // If we get a refresh token error, clear the stored session
        if (error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('Refresh Token Not Found')) {
          try {
            await clearCorruptedSession();
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          } catch (signOutError) {
            // Silent error
          }
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {

      setSession(session);

      if (session?.user?.id) {
        // Validate session on auth state change
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt && expiresAt < now) {
          // Session expired
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          return;
        }

        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }

      // Always set loading to false after auth state changes
      setLoading(false);
    }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {

      // Validate userId before making the request
      if (!userId || userId === 'undefined' || userId === 'null') {
        setUser(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No user profile found, create a basic one

        // Get the auth user data
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser && authUser.id === userId) {
          // Explicitly set the user ID to match auth.uid() for RLS policy compliance
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert({
              id: authUser.id, // Explicitly set the user ID to match auth.uid()
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
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          if (newProfile) {
            setUser(newProfile);
            return;
          }
        } else {
          setUser(null);
        }
      } else if (error) {
        // Check for specific UUID errors
        if (error.message.includes('invalid input syntax for type uuid')) {
          // Invalid UUID, clear user state
        }
        throw error;
      }

      if (data) {
        setUser(data);
      }
    } catch (error: any) {
      // Silent error - don't set user to null here as it might clear existing data
      // Let the UI handle the case where user data is missing
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
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

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type,
          },
          emailRedirectTo: undefined, // Disable email verification
          captchaToken: undefined, // Disable captcha
        },
      });

      if (error) {
        
        // Handle specific error cases
        if (error.message?.includes('Network request failed')) {

          try {
            // Try direct API call as fallback
            const directResult = await directSignUp({
              email: email.toLowerCase().trim(),
              password,
              full_name: userData.full_name,
              user_type: userData.user_type,
            });

            if (directResult.success) {

              // Continue with the rest of the signup process
              if (directResult.data?.user) {
                // Set the data to use the direct result
                const directData = { user: directResult.data.user };

                // Skip to profile verification since we have the user
                const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
                let profileCreated = false;

                for (let attempt = 1; attempt <= 10; attempt++) {
                  try {

                    const { data: profile, error: fetchErr } = await supabase
                      .from("users")
                      .select("id, email, full_name, user_type")
                      .eq("id", directResult.data.user.id)
                      .single();

                    if (profile && !fetchErr) {
                      profileCreated = true;
                      break;
                    }

                    await wait(1000);

                  } catch (profileError: any) {
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
          return { error: "Email confirmation is disabled for testing. If you see this error, please contact support." };
        }
        
        if (error.message?.includes('User already registered')) {
          return { error: "This email is already registered. Please try signing in instead." };
        }
        
        if (error.message?.includes('invalid email') || error.message?.includes('email address') || error.message?.includes('is invalid')) {
          return { error: "Supabase is rejecting this email format. Try:\n• testuser123@example.com\n• demo@outlook.com\n• yourname@yahoo.com\n\nOr check Supabase Auth settings to allow all emails." };
        }
        
        return { error: error.message };
      }

      if (!data?.user) {
        console.error("❌ No user returned from auth signup");
        return { error: "Registration failed - no user created" };
      }

      console.log("✅ Auth user created successfully, ID:", data.user.id);

      // Step 2: Check if user profile already exists, then create if needed
      try {
        console.log("🔄 Checking if user profile already exists...");
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (existingProfile) {
          console.log("✅ User profile already exists");
        } else {
          console.log("🔄 Creating user profile in database...");
          const { data: insertResult, error: insertError } = await supabase
            .from("users")
            .insert({
              id: data.user.id, // Explicitly set the user ID to match auth.uid()
              email: data.user.email,
              full_name: userData.full_name,
              user_type: userData.user_type,
              notification_preferences: {
                push_promotions: true,
                push_stock_alerts: true,
                push_new_products: true,
                email_promotions: true,
                email_stock_alerts: true,
              },
              is_active: true,
            });

          if (insertError) {
            // Handle duplicate key error gracefully
            if (insertError.message?.includes("duplicate key") || insertError.message?.includes("users_pkey")) {
              console.log("✅ User profile already exists (created by trigger)");
            } else {
              console.error("❌ Failed to create user profile:", insertError.message);
              console.log("🔄 Insert failed, waiting for database trigger...");
            }
          } else {
            console.log("✅ User profile created successfully");
          }
        }
      } catch (profileError: any) {
        console.error("❌ Error creating user profile:", profileError.message);
      }

      // Step 3: Verify profile exists (either from manual insert or trigger)
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let profileCreated = false;
      
      for (let attempt = 1; attempt <= 10; attempt++) {
        try {
          console.log(`🔄 Checking for user profile (attempt ${attempt}/10)...`);
          
          const { data: profile, error: fetchErr } = await supabase
            .from("users")
            .select("id, email, full_name, user_type")
            .eq("id", data.user.id)
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
          
          if (fetchErr) {
            console.error(`❌ Profile fetch error (attempt ${attempt}):`, fetchErr.message);
          }
          
          await wait(1000); // Wait 1 second between attempts
          
        } catch (error: any) {
          console.error(`❌ Profile check error (attempt ${attempt}):`, error.message);
          await wait(1000);
        }
      }

      if (!profileCreated) {
        console.error("❌ User profile was not created after 10 attempts");
        return { 
          error: "Registration partially completed but user profile creation failed. This is likely due to database permissions. Please contact support or try again." 
        };
      }

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
    console.log("🔐 [useAuth] resetPassword() called");
    console.log("📧 [useAuth] Email (raw):", email);

    try {
      setLoading(true);
      const cleanEmail = email.toLowerCase().trim();
      console.log("📧 [useAuth] Email (cleaned):", cleanEmail);
      console.log("🔗 [useAuth] Redirect URL:", "manzana://reset-password");

      console.log("📤 [useAuth] Calling supabase.auth.resetPasswordForEmail()...");
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: "manzana://reset-password",
        },
      );

      if (error) {
        console.error("❌ [useAuth] Supabase error returned:");
        console.error("   - Message:", error.message);
        console.error("   - Status:", error.status);
        console.error("   - Name:", error.name);

        // Handle specific error cases
        if (error.message?.includes('User not found') || error.message?.includes('Email not found')) {
          console.log("⚠️ [useAuth] User not found error");
          return { error: "No account found with this email address." };
        }

        if (error.message?.includes('Network request failed')) {
          console.log("⚠️ [useAuth] Network error");
          return { error: "Network connection failed. Please check your internet connection and try again." };
        }

        console.log("⚠️ [useAuth] Generic error");
        return { error: error.message };
      }

      console.log("✅ [useAuth] Password reset email sent successfully!");
      console.log("📬 [useAuth] Supabase should have sent email to:", cleanEmail);
      console.log("🔔 [useAuth] User should check their email inbox");
      return {};
    } catch (error: any) {
      console.error("💥 [useAuth] Unexpected error in resetPassword:");
      console.error("   - Message:", error?.message);
      console.error("   - Stack:", error?.stack);
      return { error: "Error sending password reset email. Please try again." };
    } finally {
      console.log("🔄 [useAuth] Setting loading to false");
      setLoading(false);
    }
  };

  const updateProfile = async (
    updates: Partial<User>,
  ): Promise<{ error?: string }> => {
    try {
      if (!user) {
        console.error("❌ updateProfile - No user found");
        return { error: "Usuario no autenticado" };
      }

      setLoading(true);
      console.log("🔄 Updating profile with:", updates);

      // Update user profile in database
      const { error, data } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ updateProfile error:", error);
        return { error: error.message };
      }

      console.log("✅ updateProfile success - data from database:", data);

      // Update local user state with fresh data from database
      // This ensures all fields (including region, barangay, etc.) are updated
      if (data) {
        setUser(data);
        console.log("✅ Local user state updated with fresh database data");
      } else {
        console.warn("⚠️ No data returned from update, falling back to merge");
        setUser({ ...user, ...updates });
      }

      return {};
    } catch (error) {
      console.error("❌ Unexpected updateProfile error:", error);
      return { error: "Error updating profile" };
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
