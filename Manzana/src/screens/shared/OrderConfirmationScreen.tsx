import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils';
import Button from '../../components/Button';

const { width } = Dimensions.get('window');

interface OrderConfirmationScreenProps {
  route: {
    params: {
      order: {
        id: string;
        order_number: string;
        total_amount: number;
        pickup_date: string;
        pickup_time: string;
        created_at: string;
      };
    };
  };
}

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { order } = (route.params as any) || {};

  // Prevent going back to checkout and handle tab navigation
  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        // Go to home instead of back to checkout
        const parent = navigation.getParent();
        if (parent) {
          parent.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          );
        }
        return true;
      });

      // When screen loses focus (user switches tabs or navigates away)
      return () => {
        subscription.remove();

        // Reset the current stack to its initial screen
        setTimeout(() => {
          const state = navigation.getState();
          if (state && state.routes.length > 1) {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [state.routes[0]],
              })
            );
          }
        }, 100);
      };
    }, [navigation])
  );

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
          <Text style={styles.errorText}>Order not found</Text>
          <Button
            title="Go to Home"
            onPress={() => (navigation as any).navigate('Home')}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={100} color={COLORS.success} />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your order. We'll notify you when it's ready for pickup.
          </Text>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Details</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Order Number</Text>
              <Text style={styles.infoValue}>{order.order_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pickup Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(order.pickup_date)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pickup Time</Text>
              <Text style={styles.infoValue}>{order.pickup_time}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(order.total_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentNotice}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
          <Text style={styles.paymentNoticeText}>
            Payment will be collected when you pick up your order
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="View Orders"
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Profile' }],
                  })
                );
                setTimeout(() => {
                  (navigation as any).navigate('OrderHistory');
                }, 100);
              }
            }}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Continue Shopping"
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  })
                );
              }
            }}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  successIconCircle: {
    width: width > 400 ? 140 : 120,
    height: width > 400 ? 140 : 120,
    borderRadius: width > 400 ? 70 : 60,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  successSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}15`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  paymentNoticeText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.info,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  actionButtons: {
    gap: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
});

export default OrderConfirmationScreen;
