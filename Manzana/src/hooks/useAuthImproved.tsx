import { useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { User } from "../types";
import { useAuthStore } from "../store/authStore";

/**
 * Improved Authentication Hook
 * Fixes timeout issues and uses Zustand for state management
 */
export const useAuthImproved = () => {
  const { user, session, loading, setUser, setSession, setLoading, clearAuth } = useAuthStore();

  // Fetch user profile with improved error handling
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error("❌ Invalid user ID provided:", userId);
        return null;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No user profile found, create one
          console.log("⚠️ No user profile found, creating...");
          const { data: authData } = await supabase.auth.getUser();

          if (authData?.user && authData.user.id === userId) {
            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || "User",
                user_type: authData.user.user_metadata?.user_type || "consumer",
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
              console.error("❌ Error creating user profile:", createError);
              return null;
            }

            return newProfile;
          }
        } else {
          console.error("❌ Error fetching user profile:", error);
        }
        return null;
      }

      return data;
    } catch (error: any) {
      console.error("❌ Failed to fetch user profile:", error.message);
      return null;
    }
  }, []);

  // Initialize session
  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Error getting session:", error);
        clearAuth();
        return;
      }

      setSession(currentSession);

      if (currentSession?.user?.id) {
        const userProfile = await fetchUserProfile(currentSession.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error("❌ Error initializing session:", error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, setLoading, setSession, setUser, clearAuth]);

  // Set up auth state listener
  useEffect(() => {
    // Initialize session on mount
    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("🔄 Auth state change:", event);

        setSession(currentSession);

        if (currentSession?.user?.id) {
          const userProfile = await fetchUserProfile(currentSession.user.id);
          setUser(userProfile);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeSession, fetchUserProfile, setSession, setUser, setLoading]);

  // Auth functions
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || "Unexpected error during sign in" };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>
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
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (!data?.user) {
        return { error: "Registration failed - no user created" };
      }

      // Wait for profile creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sign out immediately after registration
      if (data.session) {
        await supabase.auth.signOut();
      }

      return {};
    } catch (error: any) {
      return { error: error.message || "Unexpected error during registration" };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      clearAuth();
    } catch (error) {
      console.error("❌ Error signing out:", error);
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
        }
      );

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: "Error sending recovery email" };
    }
  };

  const updateProfile = async (
    updates: Partial<User>
  ): Promise<{ error?: string }> => {
    try {
      if (!user) {
        return { error: "User not authenticated" };
      }

      setLoading(true);

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
        return { error: error.message };
      }

      setUser({ ...user, ...updates });
      return {};
    } catch (error: any) {
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
