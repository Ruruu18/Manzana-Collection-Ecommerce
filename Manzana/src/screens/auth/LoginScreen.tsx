import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail } from "../../utils";
import { authRateLimiter, formatRemainingTime } from "../../utils/rateLimit";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";
import Input from "../../components/Input";

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn, loading } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    // Check rate limiting
    const identifier = form.email.toLowerCase();
    const rateLimitCheck = authRateLimiter.isRateLimited(identifier);

    if (rateLimitCheck.limited) {
      const timeRemaining = formatRemainingTime(rateLimitCheck.remainingTime || 0);
      Alert.alert(
        "Too Many Attempts",
        `You've made too many login attempts. Please try again in ${timeRemaining}.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const { error } = await signIn(form.email, form.password);

      if (error) {
        // Record failed attempt
        authRateLimiter.recordAttempt(identifier);

        const remainingAttempts = authRateLimiter.getRemainingAttempts(identifier);
        let errorMessage = error.includes("Invalid login credentials")
          ? "Invalid email or password."
          : "Unable to sign in. Please check your credentials.";

        if (remainingAttempts <= 2 && remainingAttempts > 0) {
          errorMessage += `\n\n${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before temporary lock.`;
        }

        Alert.alert("Login Failed", errorMessage, [{ text: "OK" }]);
        return;
      }

      // Reset rate limit on successful login
      authRateLimiter.reset(identifier);
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection.",
        [{ text: "OK" }]
      );
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear all errors when user starts typing
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/images/MANZANA-LOGO.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Manzana Collection</Text>
            <Text style={styles.subtitle}>Welcome back</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Email Input */}
            <Input
              label="Email"
              placeholder="Email"
              value={form.email}
              onChangeText={(text) => updateForm("email", text)}
              leftIcon="mail-outline"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              returnKeyType="next"
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="Enter Password"
              value={form.password}
              onChangeText={(text) => updateForm("password", text)}
              leftIcon="lock-closed-outline"
              error={errors.password}
              secureTextEntry={true}
              showPasswordToggle={true}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate("ForgotPassword")}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot your password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000cc',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    position: 'absolute',
    top: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 999,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: "bold",
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  form: {
    flex: 1,
  },

  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
  },
  loginButton: {
    marginBottom: SPACING.xl,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default LoginScreen;
