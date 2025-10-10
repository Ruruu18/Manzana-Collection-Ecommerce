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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { validatePhone } from "../../utils";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import Button from "../../components/Button";
import { ProfileSetupForm } from "../../types";

interface ProfileSetupScreenProps {
  navigation: any;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
}) => {
  const { user, updateProfile, loading } = useAuth();
  const [form, setForm] = useState<ProfileSetupForm>({
    fullName: user?.full_name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    businessName: "",
    taxId: "",
  });
  const [errors, setErrors] = useState<Partial<ProfileSetupForm>>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const isReseller = user?.user_type === "reseller";
  const totalSteps = isReseller ? 3 : 2;

  const validateCurrentStep = (): boolean => {
    const newErrors: Partial<ProfileSetupForm> = {};

    if (step === 1) {
      if (!form.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }

      if (form.phone && !validatePhone(form.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    if (step === 2) {
      if (form.address && form.address.trim().length < 10) {
        newErrors.address = "Address must be at least 10 characters long";
      }

      if (form.postalCode && !/^\d{4}$/.test(form.postalCode)) {
        newErrors.postalCode = "Postal code must be 4 digits";
      }
    }

    if (step === 3 && isReseller) {
      if (!form.businessName?.trim()) {
        newErrors.businessName = "Business name is required";
      }

      if (!form.taxId?.trim()) {
        newErrors.taxId = "Tax ID is required";
      } else if (
        !/^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(form.taxId)
      ) {
        newErrors.taxId = "Please enter a valid Tax ID";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;

    try {
      const updates: any = {
        full_name: form.fullName,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        postal_code: form.postalCode || null,
        avatar_url: avatarUri || user?.avatar_url,
      };

      if (isReseller) {
        updates.business_name = form.businessName;
        updates.tax_id = form.taxId;
      }

      const { error } = await updateProfile(updates);

      if (error) {
        Alert.alert("Error", error);
        return;
      }

      // Navigate to Main screen
      navigation.navigate("Main");
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleSkip = () => {
    // Navigate to Main screen
    navigation.navigate("Main");
  };

  const updateForm = (field: keyof ProfileSetupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permissions", "We need permissions to access your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Complete your profile for a better experience
      </Text>

      {/* Avatar */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatarUri || user?.avatar_url ? (
          <Image
            source={{ uri: avatarUri || user?.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={COLORS.textSecondary} />
          </View>
        )}
        <View style={styles.avatarEdit}>
          <Ionicons name="camera" size={16} color={COLORS.white} />
        </View>
      </TouchableOpacity>

      {/* Full Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.fullName && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={errors.fullName ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={(text) => updateForm("fullName", text)}
            placeholder="Your full name"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName}</Text>
        )}
      </View>

      {/* Phone */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.phone && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={errors.phone ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(text) => updateForm("phone", text)}
            placeholder="55 1234 5678"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address</Text>
      <Text style={styles.stepDescription}>
        This information helps us personalize offers for you
      </Text>

      {/* Address */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.address && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={errors.address ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(text) => updateForm("address", text)}
            placeholder="Street, number, neighborhood"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={2}
            editable={!loading}
          />
        </View>
        {errors.address && (
          <Text style={styles.errorText}>{errors.address}</Text>
        )}
      </View>

      {/* City and State */}
      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>City</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="business-outline"
              size={20}
              color={COLORS.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(text) => updateForm("city", text)}
              placeholder="City"
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          </View>
        </View>

        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>State</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="map-outline"
              size={20}
              color={COLORS.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.state}
              onChangeText={(text) => updateForm("state", text)}
              placeholder="State"
              placeholderTextColor={COLORS.textSecondary}
              editable={!loading}
            />
          </View>
        </View>
      </View>

      {/* Postal Code */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Postal Code</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.postalCode && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={errors.postalCode ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.postalCode}
            onChangeText={(text) => updateForm("postalCode", text)}
            placeholder="1234"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="number-pad"
            maxLength={4}
            editable={!loading}
          />
        </View>
        {errors.postalCode && (
          <Text style={styles.errorText}>{errors.postalCode}</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepDescription}>
        Required information to access wholesale prices
      </Text>

      {/* Business Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Business Name *</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.businessName && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="storefront-outline"
            size={20}
            color={errors.businessName ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.businessName}
            onChangeText={(text) => updateForm("businessName", text)}
            placeholder="My Boutique"
            placeholderTextColor={COLORS.textSecondary}
            editable={!loading}
          />
        </View>
        {errors.businessName && (
          <Text style={styles.errorText}>{errors.businessName}</Text>
        )}
      </View>

      {/* Tax ID */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tax ID *</Text>
        <View
          style={[
            styles.inputWrapper,
            errors.taxId && styles.inputWrapperError,
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={errors.taxId ? COLORS.error : COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={form.taxId}
            onChangeText={(text) => updateForm("taxId", text.toUpperCase())}
            placeholder="XAXX010101000"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            maxLength={13}
            editable={!loading}
          />
        </View>
        {errors.taxId && <Text style={styles.errorText}>{errors.taxId}</Text>}
        <Text style={styles.helpText}>
          Required for invoicing and wholesale discounts
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {step} of {totalSteps}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {step > 1 && (
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="outline"
                style={styles.backButton}
              />
            )}

            <Button
              title={step === totalSteps ? "Complete" : "Next"}
              onPress={handleNext}
              loading={loading}
              style={styles.nextButton}
              fullWidth={step === 1}
            />
          </View>
        </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "500",
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  stepDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: SPACING.xl,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  helpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButtons: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

export default ProfileSetupScreen;
