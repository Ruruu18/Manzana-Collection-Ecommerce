import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface OnboardingItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: [string, string];
}

interface OnboardingScreenProps {
  navigation: any;
}

const onboardingData: OnboardingItem[] = [
  {
    id: "1",
    title: "Welcome to",
    subtitle: "Manzana Collection!",
    description:
      "Discover the latest trends in women's fashion with the best quality and exclusive prices.",
    icon: "heart-outline",
    gradient: [COLORS.primary, COLORS.secondary] as [string, string],
  },
  {
    id: "2",
    title: "Exclusive",
    subtitle: "Promotions",
    description:
      "Access special discounts, limited offers and exclusive promotions for our customers.",
    icon: "pricetag-outline",
    gradient: [COLORS.accent, COLORS.primary] as [string, string],
  },
  {
    id: "3",
    title: "Stock",
    subtitle: "Alerts",
    description:
      "Receive notifications when your favorite products are available or on sale.",
    icon: "notifications-outline",
    gradient: [COLORS.secondary, COLORS.primary],
  },
  {
    id: "4",
    title: "Wholesale",
    subtitle: "Prices",
    description:
      "Register as a reseller and access wholesale prices with special discounts.",
    icon: "business-outline",
    gradient: [COLORS.primary, COLORS.accent],
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    } else {
      navigation.navigate("Auth");
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex });
    }
  };

  const skip = () => {
    navigation.navigate("Auth");
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon as any} size={80} color={COLORS.white} />
      </LinearGradient>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.title, styles.subtitle]}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.background}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.skipButton} onPress={skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <FlatList
            ref={flatListRef}
            data={onboardingData}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEventThrottle={32}
            style={styles.flatList}
          />

          {/* Pagination */}
          {renderPagination()}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={goToPrevious}
                >
                  <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}

              <View style={styles.nextButtonContainer}>
                <Button
                  title={
                    currentIndex === onboardingData.length - 1
                      ? "Get Started"
                      : "Next"
                  }
                  onPress={goToNext}
                  variant="secondary"
                  style={styles.nextButton}
                  icon={
                    currentIndex === onboardingData.length - 1
                      ? "checkmark"
                      : "arrow-forward"
                  }
                  iconPosition="right"
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 60,
  },
  skipButton: {
    padding: SPACING.md,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: "600",
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xxl,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    textAlign: "center",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.white,
    marginBottom: SPACING.xl,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 28,
    opacity: 0.9,
    fontSize: 18,
    paddingHorizontal: SPACING.md,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    opacity: 0.3,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    opacity: 1,
    backgroundColor: COLORS.white,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nextButton: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default OnboardingScreen;
