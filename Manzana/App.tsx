import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from "react-native";
import FlashMessage from "react-native-flash-message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/hooks/useAuth";
import { runAutoSetupCheck } from "./src/utils/autoSetupCheck";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { registerBackgroundNotificationTask } from "./src/services/backgroundNotifications";

// Create a client with optimized cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cached data is kept for 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  useEffect(() => {
    // Register background notification task for when app is closed
    registerBackgroundNotificationTask().catch(error => {
      console.error("❌ Failed to register background notification task:", error);
    });

    // Setup check disabled - registration is working properly
    // if (__DEV__) {
    //   runAutoSetupCheck().catch(error => {
    //     console.error("❌ Auto setup check failed:", error);
    //   });
    // }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppNavigator />
            <FlashMessage position="top" />
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
