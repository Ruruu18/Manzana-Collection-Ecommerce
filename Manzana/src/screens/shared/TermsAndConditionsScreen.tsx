import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/theme";

interface TermsAndConditionsScreenProps {
  navigation: any;
}

interface TermSectionProps {
  number: number;
  title: string;
  content: string;
}

const TermSection: React.FC<TermSectionProps> = ({ number, title, content }) => (
  <View style={styles.termSection}>
    <View style={styles.termHeader}>
      <View style={styles.termNumberContainer}>
        <Text style={styles.termNumber}>{number}</Text>
      </View>
      <Text style={styles.termTitle}>{title}</Text>
    </View>
    <Text style={styles.termContent}>{content}</Text>
  </View>
);

const TermsAndConditionsScreen: React.FC<TermsAndConditionsScreenProps> = ({ navigation }) => {
  const terms = [
    {
      title: "Account Registration",
      content: "You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
    },
    {
      title: "Acceptable Use",
      content: "You agree to use the Manzana Collection app for legitimate purposes only. You must not misuse our services, attempt unauthorized access, or engage in any activity that could harm the app or other users.",
    },
    {
      title: "Account Security",
      content: "You must not share your account credentials with others. You are responsible for notifying us immediately if you suspect any unauthorized use of your account.",
    },
    {
      title: "Pickup and Return Policies",
      content: "Orders must be picked up within the scheduled timeframe. Failure to pick up orders within 3 days may result in cancellation. Returns and exchanges are subject to our return policy.",
    },
    {
      title: "Product Availability",
      content: "All products are subject to availability. We reserve the right to limit quantities or discontinue products at any time. Product images are for illustration purposes and may differ from actual items.",
    },
    {
      title: "Pricing",
      content: "All prices are in Philippine Peso (PHP) and are subject to change without notice. We reserve the right to correct pricing errors. Promotional prices are valid only during the specified promotion period.",
    },
    {
      title: "Order Cancellation",
      content: "You may cancel pending orders through the app. Once an order is confirmed or in processing, cancellation may not be possible. Contact support for assistance with order modifications.",
    },
    {
      title: "Intellectual Property",
      content: "All content, trademarks, and materials in the app are owned by Manzana Collection. You may not copy, modify, or distribute any content without our written permission.",
    },
    {
      title: "Limitation of Liability",
      content: "Manzana Collection is not liable for any indirect, incidental, or consequential damages arising from your use of the app or services. Our liability is limited to the maximum extent permitted by law.",
    },
    {
      title: "Changes to Terms",
      content: "We reserve the right to modify these Terms and Conditions at any time. Continued use of the app after changes constitutes acceptance of the updated terms.",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introContainer}>
          <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>Terms and Conditions</Text>
          <Text style={styles.introSubtitle}>
            By using Manzana Collection, you agree to the following terms and conditions
          </Text>
        </View>

        <View style={styles.termsList}>
          {terms.map((term, index) => (
            <TermSection
              key={index}
              number={index + 1}
              title={term.title}
              content={term.content}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: January 2025</Text>
          <Text style={styles.footerSubtext}>
            For questions about these terms, please contact our support team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  introContainer: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  introTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  termsList: {
    paddingHorizontal: SPACING.md,
  },
  termSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  termHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  termNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  termNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: "bold",
  },
  termTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },
  termContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingLeft: 48, // Align with title (32 + 16)
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  footerSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default TermsAndConditionsScreen;
