import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/theme";

interface ContactScreenProps {
  navigation: any;
}

interface ContactItemProps {
  icon: string;
  title: string;
  value: string;
  onPress?: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({ icon, title, value, onPress }) => (
  <TouchableOpacity
    style={styles.contactItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.contactIconContainer}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.contactTextContainer}>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    )}
  </TouchableOpacity>
);

const ContactScreen: React.FC<ContactScreenProps> = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL("mailto:support@manzanacollection.com");
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+639123456789");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introContainer}>
          <Ionicons name="chatbubbles" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>Get in Touch</Text>
          <Text style={styles.introSubtitle}>
            Our support team is here to help you with any questions or concerns
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <ContactItem
            icon="mail-outline"
            title="Email"
            value="support@manzanacollection.com"
            onPress={handleEmailPress}
          />

          <ContactItem
            icon="call-outline"
            title="Phone"
            value="+63 912 345 6789"
            onPress={handlePhonePress}
          />

          <ContactItem
            icon="location-outline"
            title="Address"
            value="Manzana Collection Store, Manila, Philippines"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Hours</Text>

          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Monday - Saturday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTimeClosed}>Closed</Text>
            </View>
          </View>
        </View>

        <View style={styles.responseTimeContainer}>
          <View style={styles.responseTimeIcon}>
            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.responseTimeText}>
            <Text style={styles.responseTimeTitle}>Response Time</Text>
            <Text style={styles.responseTimeValue}>
              We typically respond within 24 hours during business days
            </Text>
          </View>
        </View>

        <View style={styles.helpPrompt}>
          <Text style={styles.helpPromptText}>
            Before contacting us, check out our Help Center for quick answers
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate("HelpCenter")}
          >
            <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.helpButtonText}>Visit Help Center</Text>
          </TouchableOpacity>
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
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  contactValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "500",
  },
  hoursContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  hoursDay: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "500",
  },
  hoursTime: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
  hoursTimeClosed: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  responseTimeContainer: {
    flexDirection: "row",
    backgroundColor: `${COLORS.primary}10`,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  responseTimeIcon: {
    marginRight: SPACING.md,
  },
  responseTimeText: {
    flex: 1,
  },
  responseTimeTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  responseTimeValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  helpPrompt: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  helpPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  helpButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default ContactScreen;
