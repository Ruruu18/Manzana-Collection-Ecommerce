import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

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
import CategoriesScreen from "../screens/shared/CategoriesScreen";
import CartScreen from "../screens/shared/CartScreen";
import NotificationDetailsScreen from "../screens/shared/NotificationDetailsScreen";
import EditProfileScreen from "../screens/shared/EditProfileScreen";
import OrderHistoryScreen from "../screens/shared/OrderHistoryScreen";
import HelpCenterScreen from "../screens/shared/HelpCenterScreen";
import ContactScreen from "../screens/shared/ContactScreen";
import TermsAndConditionsScreen from "../screens/shared/TermsAndConditionsScreen";
import PrivacyPolicyScreen from "../screens/shared/PrivacyPolicyScreen";

import {
  MainTabParamList,
  HomeStackParamList,
  CatalogStackParamList,
  PromotionsStackParamList,
  NotificationsStackParamList,
  ProfileStackParamList,
} from "../types";

const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const PromotionsStack = createNativeStackNavigator<PromotionsStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
      <HomeStack.Screen name="Categories" component={CategoriesScreen as any} />
      <HomeStack.Screen name="Cart" component={CartScreen as any} />
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
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <ProfileStack.Screen name="Contact" component={ContactScreen} />
      <ProfileStack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  // Responsive calculations - optimized for all devices
  const tabBarHeight = Platform.select({
    ios: 50 + insets.bottom, // 50px content + safe area
    android: 60,
    default: 60,
  });
  const iconSize = 24;
  const labelFontSize = 11;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
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

          return <Ionicons name={iconName as any} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 5,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: labelFontSize,
          fontWeight: "600",
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          height: 50,
          paddingTop: 5,
          paddingBottom: 0,
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
};

export default TabNavigator;
