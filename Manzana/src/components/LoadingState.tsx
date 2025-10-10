import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING } from "../constants/theme";
import { LoadingStateProps } from "../types";

const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  emptyMessage = "No items to display",
  emptyIcon = "folder-outline",
  loadingMessage = "Loading...",
  onRetry,
  skeletonComponent,
}) => {
  if (loading) {
    // Use skeleton component if provided
    if (skeletonComponent) {
      return <>{skeletonComponent}</>;
    }

    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  if (error) {
    // Parse error to provide better messages
    const getErrorDetails = () => {
      if (typeof error === 'string') {
        if (error.includes('network') || error.includes('Network')) {
          return {
            icon: 'wifi-outline' as const,
            title: 'Connection Error',
            message: 'Unable to connect. Please check your internet connection.',
          };
        }
        if (error.includes('timeout') || error.includes('Timeout')) {
          return {
            icon: 'time-outline' as const,
            title: 'Request Timeout',
            message: 'The request took too long. Please try again.',
          };
        }
        if (error.includes('permission') || error.includes('Permission')) {
          return {
            icon: 'lock-closed-outline' as const,
            title: 'Permission Denied',
            message: error,
          };
        }
        if (error.includes('not found') || error.includes('Not Found')) {
          return {
            icon: 'search-outline' as const,
            title: 'Not Found',
            message: error,
          };
        }
      }

      return {
        icon: 'alert-circle-outline' as const,
        title: 'Something went wrong',
        message: typeof error === 'string' ? error : 'An unexpected error occurred. Please try again.',
      };
    };

    const errorDetails = getErrorDetails();

    return (
      <View style={styles.container}>
        <Ionicons name={errorDetails.icon} size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>{errorDetails.title}</Text>
        <Text style={styles.errorMessage}>{errorDetails.message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.white} style={{ marginRight: SPACING.xs }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Check if children is empty
  const isEmpty =
    React.Children.count(children) === 0 ||
    (Array.isArray(children) && children.length === 0);

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <Ionicons
          name={emptyIcon as any}
          size={64}
          color={COLORS.textSecondary}
        />
        <Text style={styles.emptyTitle}>No content</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});

export default LoadingState;
