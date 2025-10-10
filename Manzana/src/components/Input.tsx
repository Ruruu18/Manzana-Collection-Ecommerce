import React, { useState, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  showPasswordToggle?: boolean;
  accessibilityHint?: string;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      placeholder,
      error,
      leftIcon,
      rightIcon,
      onRightIconPress,
      secureTextEntry = false,
      containerStyle,
      inputStyle,
      showPasswordToggle = false,
      value,
      onChangeText,
      accessibilityHint,
      ...rest
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const isPassword = secureTextEntry || showPasswordToggle;
    const shouldShowEye = isPassword || showPasswordToggle;
    const actualSecureTextEntry = isPassword && !isPasswordVisible;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            style={styles.label}
            accessibilityRole="header"
          >
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            error && styles.inputWrapperError,
          ]}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={error ? COLORS.error : COLORS.textSecondary}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={actualSecureTextEntry}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
            accessibilityLabel={label || placeholder}
            accessibilityHint={accessibilityHint}
            {...rest}
            // Force-disable autofill for password fields regardless of caller props
            importantForAutofill={isPassword ? "no" : (rest.importantForAutofill as any) ?? "yes"}
            textContentType={isPassword ? "none" : rest.textContentType}
            autoComplete={isPassword ? "off" : rest.autoComplete}
            passwordRules={isPassword ? "" : undefined}
            keyboardType={isPassword ? "default" : rest.keyboardType}
            spellCheck={false}
          />

          {shouldShowEye && (
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={togglePasswordVisibility}
              activeOpacity={0.7}
              accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
              accessibilityRole="button"
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}

          {rightIcon && !shouldShowEye && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={error ? COLORS.error : COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
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
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    padding: 0,
    margin: 0,
    lineHeight: 20,
    includeFontPadding: false,
  },
  eyeIcon: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
    marginLeft: SPACING.xs,
  },
  rightIcon: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
    marginLeft: SPACING.xs,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

Input.displayName = "Input";

export default Input;
