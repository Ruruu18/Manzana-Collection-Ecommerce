import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail } from "../../utils";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return false;
    }

    setError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      const { error } = await resetPassword(email);

      if (error) {
        Alert.alert("Error", error);
        return;
      }

      setSent(true);
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) {
      setError("");
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={COLORS.success}
            />
          </View>

          <Text style={styles.successTitle}>Email Sent</Text>

          <Text style={styles.successMessage}>
            We have sent password reset instructions to:
          </Text>

          <Text style={styles.emailText}>{email}</Text>

          <Text style={styles.successSubtitle}>
            Check your inbox and follow the instructions to create a new
            password.
          </Text>

          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate("Login")}
            style={styles.backButton}
            fullWidth
          />

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => setSent(false)}
          >
            <Text style={styles.resendText}>
              Didn't receive the email? Send again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={60} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              Don't worry, we'll help you recover it. Enter your email and we'll
              send you the instructions.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[styles.inputWrapper, error && styles.inputWrapperError]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={error ? COLORS.error : COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  autoFocus
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Button
              title="Send Instructions"
              onPress={handleResetPassword}
              loading={loading}
              fullWidth
              style={styles.resetButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: SPACING.lg,
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    height: "100%",
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  resetButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  successIcon: {
    marginBottom: SPACING.xl,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.success,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  successMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  emailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  successSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },
  resendButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  resendText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    textAlign: "center",
  },
});

export default ForgotPasswordScreen;
