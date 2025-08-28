import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../services/supabase";
import { User, UseAuthReturn } from "../types";
import { Session } from "@supabase/supabase-js";
import { testSupabaseConnection, getConnectionErrorMessage } from "../utils/testConnection";

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

        // Maximum retry attempts for real connection
        const maxRetries = 3;
        let retryCount = 0;
        let lastError: any = null;

        while (retryCount < maxRetries) {
          try {
            // Check network connectivity first
            const networkAvailable = await checkNetworkConnectivity();
            if (!networkAvailable) {

              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              retryCount++;
              continue;
            }

            // Test connection
            const connectionTest = await testSupabaseConnection();
            if (!connectionTest.success) {

              throw new Error(getConnectionErrorMessage(connectionTest.error || 'Unknown connection error'));
            }

            const {
              data: { session },
            } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
              await fetchUserProfile(session.user.id);
            }

            // If we get here, everything worked
            return;

          } catch (error: any) {
            lastError = error;
            if (error.message?.includes("Network request failed") || 
                error.message?.includes("Unable to connect")) {

              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              continue;
            }
            throw error;
          }
        }

        // If we get here, all retries failed
        throw new Error("Unable to connect after multiple attempts. Please check your internet connection.");

      } catch (error: any) {

        // Don't throw the error, but you might want to show it in the UI
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

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      setUser(data);
    } catch (error) {
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);




      // Maximum retry attempts
      const maxRetries = 3;
      let retryCount = 0;
      let lastError: any = null;

      while (retryCount < maxRetries) {
        try {
          // Check network connectivity
          const networkAvailable = await checkNetworkConnectivity();
          if (!networkAvailable) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            retryCount++;
            continue;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
          });

          if (error) {
                      if (error.message.includes("Network request failed")) {
            retryCount++;
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          }
            return { error: error.message };
          }

          return {};
        } catch (error: any) {
          lastError = error;
          if (error.message?.includes("Network request failed")) {

            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          }
          throw error;
        }
      }


      return { error: "Network connection failed. Please check your internet connection and try again." };
    } catch (error) {

      return { error: "Unexpected error during sign in" };
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check network connectivity
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch('https://enxdypnlbcltrjuepldk.supabase.co', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      return false;
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
        },
      });



      if (error) {

        return { error: error.message };
      }



      if (data.user) {


        // Wait for database trigger to create the user profile
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        let profileCreated = false;
        
        for (let attempt = 1; attempt <= 10; attempt++) {
          try {
            const { data: profile, error: fetchErr } = await supabase
              .from("users")
              .select("id, email, full_name, user_type")
              .eq("id", data.user!.id)
              .single();

            if (profile && !fetchErr) {
              profileCreated = true;
              break;
            }
            await wait(1000); // Wait 1 second between attempts
            
          } catch (error) {
            await wait(1000);
          }
        }

        if (!profileCreated) {
          return { error: "Database error saving new user. Please try again or contact support." };
        }

        // Force sign out after registration so user must manually log in
        if (data.session) {
          await supabase.auth.signOut();
        }
      }

      return {};
    } catch (error) {

      return { error: "Unexpected error during registration" };
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
    } catch (error) {

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
