import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, Platform, StatusBar, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../constants/theme";
import TabNavigator from "./TabNavigator";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Onboarding Screens
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import ProfileSetupScreen from "../screens/onboarding/ProfileSetupScreen";

import {
  RootStackParamList,
  AuthStackParamList,
} from "../types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { user, loading, session } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [hasCheckedFirstTime, setHasCheckedFirstTime] = useState(false);

  // Development bypass - set to true to skip profile setup
  const DEV_BYPASS_PROFILE_SETUP = true;

  useEffect(() => {
    // Check if it's first time app launch
    const checkFirstTime = async () => {
      try {
        // For now, we'll skip onboarding and go straight to auth
        // You can implement AsyncStorage logic here later if needed
        setIsFirstTime(false);
        setHasCheckedFirstTime(true);
      } catch (error) {
        console.error("Error checking first time:", error);
        setIsFirstTime(false);
        setHasCheckedFirstTime(true);
      }
    };

    if (!hasCheckedFirstTime) {
      checkFirstTime();
    }

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && !hasCheckedFirstTime) {
        console.log("⏰ Timeout reached, forcing loading to false");
        setHasCheckedFirstTime(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [hasCheckedFirstTime, loading]);

  useEffect(() => {
    if (!loading && session && user) {
      // Check if user needs profile setup
      if (!DEV_BYPASS_PROFILE_SETUP && (!user.full_name || !user.phone)) {
        setNeedsProfileSetup(true);
      } else {
        setNeedsProfileSetup(false);
      }
    } else if (!loading && !session) {
      setNeedsProfileSetup(false);
    }
  }, [user, loading, session]);

  if (loading || !hasCheckedFirstTime) {
    return (
      <View style={styles.loadingContainer}>
        {Platform.OS === 'android' && (
          <StatusBar
            backgroundColor={COLORS.background}
            barStyle="dark-content"
            translucent={false}
          />
        )}
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor={COLORS.background}
          barStyle="dark-content"
          translucent={false}
        />
      )}
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
      {!session ? (
        // User is not authenticated
        <>
          {isFirstTime && (
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : needsProfileSetup ? (
        // User is authenticated but needs to complete profile
        <>
          <RootStack.Screen
            name="ProfileSetup"
            component={ProfileSetupScreen}
          />
          <RootStack.Screen name="Main" component={TabNavigator} />
        </>
      ) : (
        // User is authenticated and profile is complete
        <RootStack.Screen name="Main" component={TabNavigator} />
      )}
    </RootStack.Navigator>
    </>
  );
}

// App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
