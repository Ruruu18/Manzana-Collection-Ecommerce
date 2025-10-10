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

interface HelpCenterScreenProps {
  navigation: any;
}

interface FAQItemProps {
  question: string;
  answer: string;
  icon: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, icon }) => (
  <View style={styles.faqItem}>
    <View style={styles.faqHeader}>
      <View style={styles.faqIconContainer}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.faqQuestion}>{question}</Text>
    </View>
    <Text style={styles.faqAnswer}>{answer}</Text>
  </View>
);

const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ navigation }) => {
  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse products, add items to your cart, and proceed to checkout. You can review your order before confirming.",
      icon: "cart-outline",
    },
    {
      question: "When can I pick up my order?",
      answer: "Pickup is available starting tomorrow during business hours. You'll receive a notification when your order is ready.",
      icon: "time-outline",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cash and card payments at pickup. Please have your payment ready when collecting your order.",
      icon: "card-outline",
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "You can cancel pending orders from the Orders screen. For modifications, please contact our support team.",
      icon: "create-outline",
    },
    {
      question: "How do stock alerts work?",
      answer: "Enable stock alerts for out-of-stock products you're interested in. We'll notify you when they're back in stock.",
      icon: "notifications-outline",
    },
    {
      question: "What if I miss my pickup time?",
      answer: "Contact our support team if you need to reschedule. Orders held beyond 3 days may be cancelled.",
      icon: "alert-circle-outline",
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
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introContainer}>
          <Ionicons name="help-circle" size={48} color={COLORS.primary} />
          <Text style={styles.introTitle}>Frequently Asked Questions</Text>
          <Text style={styles.introSubtitle}>
            Find answers to common questions about using Manzana Collection
          </Text>
        </View>

        <View style={styles.faqList}>
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              icon={faq.icon}
            />
          ))}
        </View>

        <View style={styles.contactPrompt}>
          <Text style={styles.contactPromptText}>
            Still need help? Contact our support team
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate("Contact")}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
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
  faqList: {
    paddingHorizontal: SPACING.md,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  faqQuestion: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },
  faqAnswer: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingLeft: 52, // Align with question text (36 + 16)
  },
  contactPrompt: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  contactPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  contactButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default HelpCenterScreen;
