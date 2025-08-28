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
import { validateEmail, validatePassword } from "../../utils";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { RegisterForm } from "../../types";

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { signUp, loading } = useAuth();
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    userType: "consumer",
  });
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});



  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const passwordValidation = validatePassword(form.password);
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {

      const { error } = await signUp(form.email.trim(), form.password, {
        full_name: form.fullName.trim(),
        user_type: form.userType,
      });

      if (error) {
        let errorMessage = error;
        
        // Handle specific Supabase errors
        if (error.includes("Email address") && error.includes("is invalid")) {
          errorMessage = "Supabase is rejecting this email format. Try:\n• testuser123@example.com\n• demo@outlook.com\n• yourname@yahoo.com\n\nOr check Supabase Auth settings to allow all emails.";
        } else if (error.includes("already registered")) {
          errorMessage = "This email is already registered. Try signing in instead.";
        }
        
        Alert.alert("Registration Error", errorMessage);
        return;
      }

      Alert.alert(
        "Registration Successful!",
        "Your account has been created successfully. Please sign in with your credentials to continue.",
        [{ 
          text: "Sign In", 
          onPress: () => navigation.navigate("Login")
        }],
      );
    } catch (error) {
      Alert.alert(
        "Registration Error",
        "An unexpected error occurred. Please try again or contact support.",
      );
    }
  };

  const updateForm = (
    field: keyof RegisterForm,
    value: string | "consumer" | "reseller",
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const UserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <Text style={styles.label}>Account type</Text>
      <View style={styles.userTypeButtons}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            form.userType === "consumer" && styles.userTypeButtonActive,
          ]}
          onPress={() => updateForm("userType", "consumer")}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={
              form.userType === "consumer" ? COLORS.white : COLORS.textSecondary
            }
            style={styles.userTypeIcon}
          />
          <Text
            style={[
              styles.userTypeText,
              form.userType === "consumer" && styles.userTypeTextActive,
            ]}
          >
            Consumer
          </Text>
          <Text
            style={[
              styles.userTypeSubtext,
              form.userType === "consumer" && styles.userTypeSubtextActive,
            ]}
          >
            Personal purchases
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeButton,
            form.userType === "reseller" && styles.userTypeButtonActive,
          ]}
          onPress={() => updateForm("userType", "reseller")}
        >
          <Ionicons
            name="storefront-outline"
            size={20}
            color={
              form.userType === "reseller" ? COLORS.white : COLORS.textSecondary
            }
            style={styles.userTypeIcon}
          />
          <Text
            style={[
              styles.userTypeText,
              form.userType === "reseller" && styles.userTypeTextActive,
            ]}
          >
            Reseller
          </Text>
          <Text
            style={[
              styles.userTypeSubtext,
              form.userType === "reseller" && styles.userTypeSubtextActive,
            ]}
          >
            Wholesale prices
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join the Manzana Collection community
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <Input
              label="Full name"
              placeholder="Your full name"
              value={form.fullName}
              onChangeText={(text) => updateForm("fullName", text)}
              leftIcon="person-outline"
              error={errors.fullName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
            />

            {/* Email Input */}
            <Input
              label="Email"
              placeholder="your@email.com"
              value={form.email}
              onChangeText={(text) => updateForm("email", text)}
              leftIcon="mail-outline"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
              textContentType="emailAddress"
              autoComplete="email"
            />

            {/* User Type Selector */}
            <UserTypeSelector />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Your password"
              value={form.password}
              onChangeText={(text) => updateForm("password", text)}
              leftIcon="lock-closed-outline"
              error={errors.password}
              secureTextEntry={true}
              showPasswordToggle={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
              textContentType="newPassword"
              autoComplete="password-new"
            />

            {/* Confirm Password Input */}
            <Input
              label="Confirm password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChangeText={(text) => updateForm("confirmPassword", text)}
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
              secureTextEntry={true}
              showPasswordToggle={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              textContentType="newPassword"
              autoComplete="password-new"
            />

            {/* Register Button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
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
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: SPACING.lg,
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  form: {
    flex: 1,
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  userTypeContainer: {
    marginBottom: SPACING.lg,
  },
  userTypeButtons: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  userTypeButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  userTypeIcon: {
    marginBottom: SPACING.xs,
  },
  userTypeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userTypeTextActive: {
    color: COLORS.white,
  },
  userTypeSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  userTypeSubtextActive: {
    color: COLORS.white,
    opacity: 0.9,
  },
  registerButton: {
    marginTop: SPACING.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: SPACING.lg,
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
});

export default RegisterScreen;
