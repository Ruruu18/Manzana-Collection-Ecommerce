import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { cartService } from '../../services/cart';
import { orderService } from '../../services/orders';
import { supabase } from '../../services/supabase';
import { formatCurrency } from '../../utils';
import { fetchActivePromotions, getProductFinalPrice } from '../../utils/cartPromotionUtils';
import { Promotion } from '../../types';

const { width } = Dimensions.get('window');

// Get tomorrow's date
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);

  // Pickup details
  const [pickupDate, setPickupDate] = useState(getTomorrow());
  const [pickupTime, setPickupTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Contact details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'e-wallet'>('cash');

  useEffect(() => {
    loadCartSummary();
    loadPromotions();
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const loadPromotions = async () => {
    const promotions = await fetchActivePromotions();
    setActivePromotions(promotions);
  };

  const loadCartSummary = async () => {
    if (!user?.id) return;

    const { data } = await cartService.getCart(user.id);
    if (data) {
      setCartItems(data);

      // Calculate totals with promotions
      const promotions = await fetchActivePromotions();
      let finalTotal = 0;
      let originalSum = 0;

      data.forEach((item) => {
        if (!item.product) return;
        const { finalPrice, originalPrice } = getProductFinalPrice(item.product, promotions);
        // Add all variant price adjustments
        const variantAdjustment = (item.product_variants || []).reduce((sum: number, v: any) => sum + (v.price_adjustment || 0), 0);
        finalTotal += (finalPrice + variantAdjustment) * item.quantity;
        originalSum += (originalPrice + variantAdjustment) * item.quantity;
      });

      setCartTotal(finalTotal);
      setOriginalTotal(originalSum);
      setTotalDiscount(originalSum - finalTotal);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPickupDate(selectedDate);
    }
  };

  const getTimeLabel = (time: string) => {
    switch (time) {
      case 'morning':
        return '9:00 AM - 12:00 PM';
      case 'afternoon':
        return '1:00 PM - 5:00 PM';
      case 'evening':
        return '6:00 PM - 8:00 PM';
      default:
        return '';
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return false;
    }

    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return false;
    }

    // Pickup date must be at least tomorrow
    const tomorrow = getTomorrow();

    const selectedDate = new Date(pickupDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      Alert.alert('Invalid Date', 'Pickup date must be at least tomorrow');
      return false;
    }

    return true;
  };

  const validateStock = async () => {
    try {
      // Check stock for all cart items
      for (const item of cartItems) {
        if (!item.product) continue;

        const { data: product, error } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .single();

        if (error) {
          Alert.alert('Error', 'Failed to verify stock availability');
          return false;
        }

        if (!product || product.stock_quantity === 0) {
          Alert.alert(
            'Out of Stock',
            `${product?.name || 'Product'} is currently out of stock. Please remove it from your cart.`
          );
          return false;
        }

        if (item.quantity > product.stock_quantity) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${product.stock_quantity} units of ${product.name} available. You have ${item.quantity} in your cart. Please update your cart.`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Stock validation error:', error);
      Alert.alert('Error', 'Failed to verify stock availability');
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to place an order');
      return;
    }

    // Validate stock availability before proceeding
    setLoading(true);
    const stockValid = await validateStock();
    setLoading(false);

    if (!stockValid) return;

    Alert.alert(
      'Confirm Order',
      `Place order for pickup on ${pickupDate.toLocaleDateString()} at ${getTimeLabel(pickupTime)}?\n\nTotal: ${formatCurrency(cartTotal)}\nPayment at pickup: ${paymentMethod.toUpperCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);

              const { data: order, error } = await orderService.createPickupOrder({
                userId: user.id,
                pickupDate: pickupDate.toISOString(),
                pickupTime: getTimeLabel(pickupTime),
                contactNumber: phone,
                notes,
                paymentMethod,
                shippingAddress: {
                  fullName,
                  phone,
                  address: 'Pickup at store',
                  city: 'Store Location',
                },
              });

              if (error) {
                Alert.alert('Error', error);
                return;
              }

              // Success! Navigate to confirmation screen
              (navigation as any).navigate('OrderConfirmation', { order });
            } catch (error) {
              console.error('Place order error:', error);
              Alert.alert('Error', 'Failed to place order. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{cartItems.length} items</Text>
              <Text style={styles.summaryValue}>{formatCurrency(cartTotal)}</Text>
            </View>
            <Text style={styles.pickupNote}>💡 Payment at pickup - No online payment required</Text>
          </View>
        </View>

        {/* Pickup Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Schedule</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.inputText}>
                {pickupDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={pickupDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setPickupDate(selectedDate);
                        }
                      }}
                      minimumDate={getTomorrow()}
                      textColor={COLORS.text}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  value={pickupDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={getTomorrow()}
                />
              )
            )}

            <Text style={styles.label}>Preferred Time</Text>
            <View style={styles.timeOptions}>
              {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    pickupTime === time && styles.timeOptionSelected,
                  ]}
                  onPress={() => setPickupTime(time)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      pickupTime === time && styles.timeOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </Text>
                  <Text
                    style={[
                      styles.timeSlot,
                      pickupTime === time && styles.timeSlotSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {getTimeLabel(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special requests or notes?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method (At Pickup)</Text>
          <View style={styles.card}>
            {(['cash', 'card', 'e-wallet'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  paymentMethod === method && styles.paymentOptionSelected,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Ionicons
                  name={
                    method === 'cash'
                      ? 'cash-outline'
                      : method === 'card'
                      ? 'card-outline'
                      : 'phone-portrait-outline'
                  }
                  size={24}
                  color={paymentMethod === method ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentText,
                    paymentMethod === method && styles.paymentTextSelected,
                  ]}
                >
                  {method === 'cash' ? 'Cash' : method === 'card' ? 'Card' : 'E-Wallet'}
                </Text>
                {paymentMethod === method && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {/* Show discount breakdown if there's a discount */}
        {totalDiscount > 0 ? (
          <>
            <View style={styles.priceBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Original Price:</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(originalTotal)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                  Discount ({Math.round((totalDiscount / originalTotal) * 100)}%):
                </Text>
                <Text style={[styles.breakdownValue, styles.discountValue]}>-{formatCurrency(totalDiscount)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total to pay at pickup:</Text>
                <Text style={styles.totalValue}>{formatCurrency(cartTotal)}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total to pay at pickup:</Text>
            <Text style={styles.totalValue}>{formatCurrency(cartTotal)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flexWrap: 'wrap',
    flex: 1,
  },
  summaryValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
    flexShrink: 0,
    marginLeft: SPACING.sm,
  },
  pickupNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  inputText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
    flexWrap: 'wrap',
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeOption: {
    flex: 1,
    minWidth: width > 400 ? 120 : 100,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  timeOptionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: COLORS.primary,
  },
  timeSlot: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  timeSlotSelected: {
    color: COLORS.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  paymentOptionSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  paymentText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
    flexWrap: 'wrap',
  },
  paymentTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bottomContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  priceBreakdown: {
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  breakdownLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
  },
  discountLabel: {
    color: COLORS.success,
    fontWeight: '600',
  },
  discountValue: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  totalLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: '600',
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: 'bold',
    flexShrink: 0,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerDone: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 17,
  },
});

export default CheckoutScreen;
