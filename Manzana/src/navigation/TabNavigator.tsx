import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import AlertsScreen from "../screens/AlertsScreen";
import PromotionsScreen from "../screens/PromotionsScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type TabParamList = {
  Home: undefined;
  Alerts: undefined;
  Promotions: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ focused, emoji }: { focused: boolean; emoji: string }) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Text
      style={{
        fontSize: focused ? 24 : 20,
        opacity: focused ? 1 : 0.6,
      }}
    >
      {emoji}
    </Text>
  </View>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarActiveTintColor: "#FF69B4",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🔔" />,
          tabBarBadge: 3, // Shows notification count
        }}
      />
      <Tab.Screen
        name="Promotions"
        component={PromotionsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏷️" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
