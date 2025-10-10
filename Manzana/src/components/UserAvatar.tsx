import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface UserAvatarProps {
  fullName?: string;
  size?: number;
  fontSize?: number;
  onPress?: () => void;
  showEditIcon?: boolean;
}

/**
 * UserAvatar Component
 * Displays user's initials in a colored circle
 * Color is deterministically generated from the user's name
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  fullName = 'User',
  size = 80,
  fontSize,
  onPress,
  showEditIcon = false,
}) => {
  /**
   * Extract initials from full name
   * Examples:
   * - "Maria Santos" → "MS"
   * - "Juan Dela Cruz" → "JC"
   * - "Ana" → "A"
   */
  const getInitials = (name: string): string => {
    const trimmedName = name.trim();
    if (!trimmedName) return 'U';

    const names = trimmedName.split(' ').filter(n => n.length > 0);

    if (names.length >= 2) {
      // First name + Last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }

    // Single name - use first letter
    return names[0][0].toUpperCase();
  };

  /**
   * Generate consistent color based on name
   * Same name always gets same color
   */
  const getColorFromName = (name: string): string => {
    const colors = [
      '#D4587A', // Brand pink (primary)
      '#3498db', // Blue
      '#e74c3c', // Red
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#f39c12', // Orange
      '#16a085', // Dark teal
      '#c0392b', // Dark red
      '#8e44ad', // Dark purple
      '#2980b9', // Dark blue
    ];

    // Generate hash from name
    const hash = name
      .toLowerCase()
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return colors[hash % colors.length];
  };

  const initials = getInitials(fullName);
  const backgroundColor = getColorFromName(fullName);
  const calculatedFontSize = fontSize || size * 0.4;

  const avatarContent = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: calculatedFontSize,
            lineHeight: calculatedFontSize * 1.2,
          },
        ]}
      >
        {initials}
      </Text>

      {showEditIcon && (
        <View style={[styles.editIconContainer, { width: size * 0.3, height: size * 0.3 }]}>
          <Ionicons name="pencil" size={size * 0.18} color={COLORS.white} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  initials: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default UserAvatar;
