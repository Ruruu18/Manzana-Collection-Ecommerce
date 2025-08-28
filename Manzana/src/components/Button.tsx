import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { hapticFeedback } from '../utils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      hapticFeedback.light();
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      ...getSizeStyle(),
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? COLORS.gray400 : COLORS.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? COLORS.gray200 : COLORS.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? COLORS.gray400 : COLORS.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: disabled ? COLORS.gray400 : COLORS.error,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingHorizontal: SPACING.xl,
          paddingVertical: SPACING.lg,
          minHeight: 56,
        };
      default: // medium
        return {
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          minHeight: 48,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...TYPOGRAPHY.button,
    };

    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: disabled ? COLORS.gray600 : COLORS.white,
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? COLORS.gray600 : COLORS.text,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? COLORS.gray400 : COLORS.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? COLORS.gray400 : COLORS.primary,
        };
      case 'danger':
        return {
          ...baseStyle,
          color: disabled ? COLORS.gray600 : COLORS.white,
        };
      default:
        return baseStyle;
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return disabled ? COLORS.gray600 : COLORS.white;
      case 'secondary':
        return disabled ? COLORS.gray600 : COLORS.text;
      case 'outline':
      case 'ghost':
        return disabled ? COLORS.gray400 : COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Ionicons
        name={icon as any}
        size={getIconSize()}
        color={getIconColor()}
        style={[
          iconPosition === 'left' ? styles.iconLeft : styles.iconRight,
        ]}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getIconColor()}
        />
      );
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={disabled || loading ? 1 : 0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
