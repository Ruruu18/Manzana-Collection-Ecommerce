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

interface PrivacyPolicyScreenProps {
  navigation: any;
}

interface PolicySectionProps {
  icon: string;
  title: string;
  content: string;
}

const PolicySection: React.FC<PolicySectionProps> = ({ icon, title, content }) => (
  <View style={styles.policySection}>
    <View style={styles.policyHeader}>
      <View style={styles.policyIconContainer}>
        <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.policyTitle}>{title}</Text>
    </View>
    <Text style={styles.policyContent}>{content}</Text>
  </View>
);

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const sections = [
    {
      icon: "information-circle-outline",
      title: "Information We Collect",
      content: "We collect personal information that you provide to us, including your name, email address, phone number, and delivery address. We also collect information about your orders, preferences, and interactions with our app.",
    },
    {
      icon: "person-outline",
      title: "Account Information",
      content: "When you create an account, we collect your name, email, phone number, and user type (consumer or reseller). For resellers, we also collect business information such as business name and tax identification.",
    },
    {
      icon: "cart-outline",
      title: "Order History",
      content: "We maintain records of your purchase history, including products ordered, quantities, prices, and pickup times. This helps us provide better service and personalized recommendations.",
    },
    {
      icon: "heart-outline",
      title: "Preferences",
      content: "We collect information about your product preferences, wishlist items, and stock alert settings to help you discover products you might like and notify you when items become available.",
    },
    {
      icon: "phone-portrait-outline",
      title: "Device and Usage Data",
      content: "We collect information about your device, including device type, operating system, and app usage patterns. This helps us improve app performance and user experience.",
    },
    {
      icon: "shield-checkmark-outline",
      title: "How We Use Your Data",
      content: "We use your information to process orders, send notifications about promotions and stock alerts, improve our services, and provide customer support. We analyze usage data to enhance app functionality.",
    },
    {
      icon: "lock-closed-outline",
      title: "Data Security",
      content: "We implement industry-standard security measures to protect your personal information. Your data is encrypted in transit and at rest. We regularly update our security practices to ensure your information remains safe.",
    },
    {
      icon: "notifications-outline",
      title: "Notifications",
      content: "With your permission, we send push notifications about order updates, promotions, and stock alerts. You can manage notification preferences in the app settings at any time.",
    },
    {
      icon: "people-outline",
      title: "Third-Party Sharing",
      content: "We never sell your personal information to third parties. We may share data with service providers who help us operate our app and services, but only to the extent necessary and under strict confidentiality agreements.",
    },
    {
      icon: "trash-outline",
      title: "Data Retention",
      content: "We retain your account information as long as your account is active. You can request deletion of your account and personal data at any time by contacting our support team.",
    },
    {
      icon: "create-outline",
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information. You can exercise these rights through the app settings or by contacting our support team.",
    },
    {
      icon: "refresh-outline",
      title: "Policy Updates",
      content: "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Your continued use after changes indicates acceptance of the updated policy.",
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introContainer}>
          <Ionicons name="document-text" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>Privacy Policy</Text>
          <Text style={styles.introSubtitle}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </Text>
        </View>

        <View style={styles.policyList}>
          {sections.map((section, index) => (
            <PolicySection
              key={index}
              icon={section.icon}
              title={section.title}
              content={section.content}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: January 2025</Text>
          <Text style={styles.footerSubtext}>
            For questions about this policy, please contact our support team
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
  policyList: {
    paddingHorizontal: SPACING.md,
  },
  policySection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  policyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  policyTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },
  policyContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingLeft: 56, // Align with title (40 + 16)
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

export default PrivacyPolicyScreen;
