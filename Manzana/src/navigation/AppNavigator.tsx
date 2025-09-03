import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { COLORS, TYPOGRAPHY } from "../constants/theme";
import LoadingState from "../components/LoadingState";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Onboarding Screens
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import ProfileSetupScreen from "../screens/onboarding/ProfileSetupScreen";

// Main Screens
import HomeScreen from "../screens/main/home/HomeScreen";
import CatalogScreen from "../screens/main/catalog/CatalogScreen";
import PromotionsScreen from "../screens/main/promotions/PromotionsScreen";
import NotificationsScreen from "../screens/main/notifications/NotificationsScreen";
import ProfileScreen from "../screens/main/profile/ProfileScreen";

// Shared Screens
import ProductDetailsScreen from "../screens/shared/ProductDetailsScreen";
import SearchScreen from "../screens/shared/SearchScreen";
import WishlistScreen from "../screens/shared/WishlistScreen";
import SettingsScreen from "../screens/shared/SettingsScreen";
import StockAlertsScreen from "../screens/shared/StockAlertsScreen";
import PromotionDetailsScreen from "../screens/shared/PromotionDetailsScreen";
import CategoryProductsScreen from "../screens/shared/CategoryProductsScreen";
import NotificationDetailsScreen from "../screens/shared/NotificationDetailsScreen";
import EditProfileScreen from "../screens/shared/EditProfileScreen";
import OrderHistoryScreen from "../screens/shared/OrderHistoryScreen";

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  CatalogStackParamList,
  PromotionsStackParamList,
  NotificationsStackParamList,
  ProfileStackParamList,
} from "../types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const PromotionsStack = createNativeStackNavigator<PromotionsStackParamList>();
const NotificationsStack =
  createNativeStackNavigator<NotificationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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

// Home Stack Navigator
function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen as any}
      />
      <HomeStack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen as any}
      />
      <HomeStack.Screen name="Search" component={SearchScreen as any} />
    </HomeStack.Navigator>
  );
}

// Catalog Stack Navigator
function CatalogNavigator() {
  return (
    <CatalogStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <CatalogStack.Screen
        name="CatalogScreen"
        component={CatalogScreen as any}
      />
      <CatalogStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen as any}
      />
      <CatalogStack.Screen name="Search" component={SearchScreen as any} />
    </CatalogStack.Navigator>
  );
}

// Promotions Stack Navigator
function PromotionsNavigator() {
  return (
    <PromotionsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <PromotionsStack.Screen
        name="PromotionsScreen"
        component={PromotionsScreen}
      />
      <PromotionsStack.Screen
        name="PromotionDetails"
        component={PromotionDetailsScreen as any}
      />
      <PromotionsStack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen as any}
      />
    </PromotionsStack.Navigator>
  );
}

// Notifications Stack Navigator
function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <NotificationsStack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
      />
      <NotificationsStack.Screen
        name="NotificationDetails"
        component={NotificationDetailsScreen as any}
      />
    </NotificationsStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Wishlist" component={WishlistScreen} />
      <ProfileStack.Screen name="StockAlerts" component={StockAlertsScreen} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Catalog") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Promotions") {
            iconName = focused ? "pricetag" : "pricetag-outline";
          } else if (route.name === "Notifications") {
            iconName = focused ? "notifications" : "notifications-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-outline";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
          marginTop: 4,
        },
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarLabel: "Home" }}
      />
      <MainTab.Screen
        name="Catalog"
        component={CatalogNavigator}
        options={{ tabBarLabel: "Catalog" }}
      />
      <MainTab.Screen
        name="Promotions"
        component={PromotionsNavigator}
        options={{ tabBarLabel: "Promotions" }}
      />
      <MainTab.Screen
        name="Notifications"
        component={NotificationsNavigator}
        options={{ tabBarLabel: "Notifications" }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: "Profile" }}
      />
    </MainTab.Navigator>
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
        setLoading(false);
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
    return <LoadingState loading={true} />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
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
          <RootStack.Screen name="Main" component={MainNavigator} />
        </>
      ) : (
        // User is authenticated and profile is complete
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
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
