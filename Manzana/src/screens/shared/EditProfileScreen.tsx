import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase, handleSupabaseError } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import { validateEmail, validatePhone } from "../../utils";
import Button from "../../components/Button";

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  user_type: "consumer" | "reseller";
}

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    user_type: "consumer",
  });
  const [errors, setErrors] = useState<Partial<ProfileForm>>({});

  useEffect(() => {
    console.log("🔍 EditProfileScreen - User data:", {
      hasUser: !!user,
      userId: user?.id,
      fullName: user?.full_name,
      email: user?.email,
      userType: user?.user_type,
      phone: user?.phone,
      address: user?.address,
      city: user?.city,
      state: user?.state,
      zipCode: user?.zip_code
    });
    
    if (user) {
      const newForm = {
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        postal_code: user.zip_code || "",
        user_type: user.user_type || "consumer",
      };
      
      console.log("🔄 EditProfileScreen - Setting form data:", newForm);
      setForm(newForm);
    } else {
      console.log("⚠️ EditProfileScreen - No user data available");
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileForm> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone = "Please enter a valid phone";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check if user is authenticated and has valid ID
    if (!user || !user.id) {
      console.error("❌ No authenticated user or user ID found");
      Alert.alert("Error", "You must be logged in to update your profile. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Updating profile for user ID:", user.id);

      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          user_type: form.user_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Database update error:", error);
        throw error;
      }

      console.log("✅ Database profile updated successfully");

      // Update email separately if changed
      if (form.email !== user.email) {
        console.log("🔄 Updating email from", user.email, "to", form.email);
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });

        if (emailError) {
          console.error("❌ Email update error:", emailError);
          throw emailError;
        }
        console.log("✅ Email updated successfully");
      }

      // Update local user state
      await updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.postal_code,
      });
      
      console.log("✅ Profile update completed successfully");
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      
      const errorInfo = handleSupabaseError(error);
      const errorMessage = errorInfo?.userMessage || "Failed to update profile. Please try again.";
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        <Text
          style={[
            styles.saveButtonText,
            loading && styles.saveButtonTextDisabled,
          ]}
        >
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInput = (
    label: string,
    field: keyof ProfileForm,
    placeholder: string,
    keyboardType: any = "default",
    multiline: boolean = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError,
        ]}
        value={form[field]}
        onChangeText={(text) => updateForm(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={field === "email" ? "none" : "words"}
        autoCorrect={false}
        editable={!loading}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderUserTypeSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>User Type</Text>
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeOption,
            form.user_type === "consumer" && styles.userTypeOptionActive,
          ]}
          onPress={() => updateForm("user_type", "consumer")}
          disabled={loading}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={
              form.user_type === "consumer" ? COLORS.white : COLORS.primary
            }
          />
          <Text
            style={[
              styles.userTypeText,
              form.user_type === "consumer" && styles.userTypeTextActive,
            ]}
          >
            Consumer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeOption,
            form.user_type === "reseller" && styles.userTypeOptionActive,
          ]}
          onPress={() => updateForm("user_type", "reseller")}
          disabled={loading}
        >
          <Ionicons
            name="business-outline"
            size={24}
            color={
              form.user_type === "reseller" ? COLORS.white : COLORS.primary
            }
          />
          <Text
            style={[
              styles.userTypeText,
              form.user_type === "reseller" && styles.userTypeTextActive,
            ]}
          >
            Reseller
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show loading screen while authentication is in progress
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen if user is not authenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorMessage}>
            You must be signed in to edit your profile.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInput("Full Name", "full_name", "Your full name")}
            {renderInput("Email", "email", "your@email.com", "email-address")}
            {renderInput("Phone", "phone", "+1234567890", "phone-pad")}
            {renderUserTypeSelector()}
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            {renderInput(
              "Address",
              "address",
              "Street, number, neighborhood",
              "default",
              true,
            )}
            {renderInput("City", "city", "Your city")}
            {renderInput("State", "state", "Your state")}
            {renderInput("ZIP Code", "postal_code", "12345", "numeric")}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
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
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
  saveButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.lg,
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
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  userTypeContainer: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  userTypeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  userTypeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  userTypeText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
  userTypeTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: "center",
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  errorButton: {
    minWidth: 120,
  },
});

export default EditProfileScreen;
