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
import Picker from "../../components/Picker";
import UserAvatar from "../../components/UserAvatar";
import {
  getRegions,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
  philippineLocations,
} from "../../data/philippineLocations";

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

  // Location state
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  useEffect(() => {
    console.log("🔍 EditProfileScreen - User data:", {
      hasUser: !!user,
      userId: user?.id,
      fullName: user?.full_name,
      email: user?.email,
      userType: user?.user_type,
      phone: user?.phone,
      address: user?.address,
      region: user?.region,
      state: user?.state,
      city: user?.city,
      barangay: user?.barangay,
      postalCode: user?.postal_code
    });
    
    if (user) {
      const newForm = {
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        postal_code: user.postal_code || "",
        user_type: user.user_type || "consumer",
      };

      console.log("🔄 EditProfileScreen - Setting form data:", newForm);
      setForm(newForm);

      // Load existing location data directly if available (after migration)
      if (user.region) setRegion(user.region);
      if (user.state) setProvince(user.state);
      if (user.city) setCity(user.city);
      if (user.barangay) setBarangay(user.barangay);

      // Auto-detect region from existing province/city data ONLY if region is missing
      if (!user.region && (user.state || user.city)) {
        let foundRegion = false;

        // Find the region that contains this province or city
        for (const region of philippineLocations) {
          if (foundRegion) break;

          // Check if province matches
          if (user.state) {
            const matchedProvince = region.provinces.find(
              (p) => p.name.toLowerCase() === user.state.toLowerCase()
            );
            if (matchedProvince) {
              setRegion(region.name);
              setProvince(matchedProvince.name); // Use exact name from data

              // Try to match city with case-insensitive search
              if (user.city) {
                const matchedCity = matchedProvince.cities.find(
                  (c) => c.name.toLowerCase().includes(user.city.toLowerCase()) ||
                         user.city.toLowerCase().includes(c.name.toLowerCase())
                );
                if (matchedCity) {
                  setCity(matchedCity.name); // Use exact name from data
                }
              }
              foundRegion = true;
              break;
            }
          }

          // If no province match, try to find by city alone
          if (!user.state && user.city) {
            for (const province of region.provinces) {
              const matchedCity = province.cities.find(
                (c) => c.name.toLowerCase().includes(user.city.toLowerCase()) ||
                       user.city.toLowerCase().includes(c.name.toLowerCase())
              );
              if (matchedCity) {
                setRegion(region.name);
                setProvince(province.name);
                setCity(matchedCity.name); // Use exact name from data
                foundRegion = true;
                break;
              }
            }
          }
        }
      }

      // Load street address
      if (user.address) {
        // If barangay is already in separate field, use address as-is
        if (user.barangay) {
          setStreetAddress(user.address);
        } else {
          // Try to extract barangay from address for old data format
          const parts = user.address.split(",");
          if (parts.length >= 2) {
            setStreetAddress(parts[0].trim());
            if (!user.barangay) setBarangay(parts[1].trim());
          } else {
            setStreetAddress(user.address);
          }
        }
      }
    } else {
      console.log("⚠️ EditProfileScreen - No user data available");
    }
  }, [user]);

  // Reset province when region changes
  useEffect(() => {
    if (region && province) {
      const provinces = getProvincesByRegion(region);
      if (!provinces.includes(province)) {
        setProvince("");
        setCity("");
        setBarangay("");
      }
    }
  }, [region]);

  // Reset city when province changes
  useEffect(() => {
    if (region && province && city) {
      const cities = getCitiesByProvince(region, province);
      if (!cities.includes(city)) {
        setCity("");
        setBarangay("");
      }
    }
  }, [province]);

  // Reset barangay when city changes
  useEffect(() => {
    if (region && province && city && barangay) {
      const barangays = getBarangaysByCity(region, province, city);
      if (!barangays.includes(barangay)) {
        setBarangay("");
      }
    }
  }, [city]);

  // Update form address when location changes
  useEffect(() => {
    if (streetAddress && barangay) {
      setForm((prev) => ({
        ...prev,
        address: `${streetAddress}, ${barangay}`,
        city: city,
        state: province,
      }));
    } else if (streetAddress) {
      setForm((prev) => ({
        ...prev,
        address: streetAddress,
        city: city,
        state: province,
      }));
    }
  }, [streetAddress, barangay, city, province]);

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

      // Prepare address fields
      const addressData: any = {
        full_name: form.full_name,
        phone: form.phone,
        user_type: form.user_type,
        updated_at: new Date().toISOString(),
      };

      // Add location fields if they exist
      if (region) addressData.region = region;
      if (province) addressData.state = province;
      if (city) addressData.city = city;
      if (barangay) addressData.barangay = barangay;
      if (streetAddress) addressData.address = streetAddress;
      if (form.postal_code) addressData.postal_code = form.postal_code;

      const { data, error } = await supabase
        .from("users")
        .update(addressData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Database update error:", error);
        throw error;
      }

      console.log("✅ Database profile updated successfully:", data);

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

      // Update local user state with the data from database
      await updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        address: streetAddress,
        city: city,
        state: province,
        postal_code: form.postal_code,
      });

      console.log("✅ Profile update completed successfully with phone:", form.phone);
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
    editable: boolean = true,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        value={form[field]}
        onChangeText={(text) => updateForm(field, text)}
        editable={editable}
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
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <UserAvatar
              fullName={form.full_name || user?.full_name || "User"}
              size={100}
              showEditIcon={false}
            />
            <Text style={styles.avatarHint}>
              Your avatar is generated from your name
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInput("Full Name", "full_name", "Your full name")}
            {renderInput("Email", "email", "your@email.com", "email-address", false, false)}
            <Text style={styles.helperText}>Email cannot be changed for security reasons</Text>
            {renderInput("Phone", "phone", "09XX XXX XXXX", "phone-pad")}
            {renderUserTypeSelector()}
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <Picker
              label="Region"
              value={region}
              placeholder="Select region"
              options={getRegions()}
              onSelect={(value) => {
                setRegion(value);
                setProvince("");
                setCity("");
                setBarangay("");
              }}
              disabled={loading}
            />

            <Picker
              label="Province"
              value={province}
              placeholder="Select province"
              options={region ? getProvincesByRegion(region) : []}
              onSelect={(value) => {
                setProvince(value);
                setCity("");
                setBarangay("");
              }}
              disabled={!region || loading}
            />

            <Picker
              label="City/Municipality"
              value={city}
              placeholder="Select city"
              options={
                region && province ? getCitiesByProvince(region, province) : []
              }
              onSelect={(value) => {
                setCity(value);
                setBarangay("");
              }}
              disabled={!province || loading}
            />

            <Picker
              label="Barangay"
              value={barangay}
              placeholder="Select barangay"
              options={
                region && province && city
                  ? getBarangaysByCity(region, province, city)
                  : []
              }
              onSelect={setBarangay}
              disabled={!city || loading}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={streetAddress}
                onChangeText={setStreetAddress}
                placeholder="House/Unit No., Street Name"
                placeholderTextColor={COLORS.textSecondary}
                editable={!loading}
              />
            </View>

            {renderInput("Postal Code", "postal_code", "1000", "numeric")}
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
  inputDisabled: {
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  avatarHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default EditProfileScreen;
