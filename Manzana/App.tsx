import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/hooks/useAuth";
import { runAutoSetupCheck } from "./src/utils/autoSetupCheck";

export default function App() {
  useEffect(() => {
    // Setup check disabled - registration is working properly
    // if (__DEV__) {
    //   runAutoSetupCheck().catch(error => {
    //     console.error("❌ Auto setup check failed:", error);
    //   });
    // }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
