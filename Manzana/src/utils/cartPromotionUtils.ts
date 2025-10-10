import { supabase } from '../services/supabase';
import { Product, Promotion } from '../types';
import { calculatePromotionPrice } from './promotionUtils';

/**
 * Fetch active promotions from the database
 */
export async function fetchActivePromotions(): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .lte('start_date', new Date().toISOString());

    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }
}

/**
 * Calculate the final price for a product including active promotions
 * Returns the lowest price between: original price, discounted_price, and promotion price
 */
export function getProductFinalPrice(
  product: Product,
  activePromotions: Promotion[]
): {
  finalPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  hasPromotion: boolean;
  appliedPromotion: Promotion | null;
} {
  const originalPrice = product.price || 0;
  const discountedPrice = product.discounted_price || null;

  // Calculate promotion price
  const promotionResult = calculatePromotionPrice(product, activePromotions);

  // Determine the final price (lowest of all)
  let finalPrice = originalPrice;
  let hasDiscount = false;
  let hasPromotion = false;
  let appliedPromotion: Promotion | null = null;

  // Check if there's a discounted price
  if (discountedPrice && discountedPrice < finalPrice) {
    finalPrice = discountedPrice;
    hasDiscount = true;
  }

  // Check if there's a promotion price that's even lower
  if (promotionResult.promotionPrice && promotionResult.promotionPrice < finalPrice) {
    finalPrice = promotionResult.promotionPrice;
    hasPromotion = true;
    hasDiscount = false; // Promotion overrides discount
    appliedPromotion = promotionResult.appliedPromotion;
  }

  return {
    finalPrice,
    originalPrice,
    hasDiscount,
    hasPromotion,
    appliedPromotion,
  };
}

/**
 * Calculate cart total with promotions applied
 */
export async function calculateCartTotal(cartItems: any[]): Promise<{
  subtotal: number;
  originalTotal: number;
  totalDiscount: number;
  totalPromotionDiscount: number;
  appliedPromotions: Promotion[];
}> {
  // Fetch active promotions
  const activePromotions = await fetchActivePromotions();

  let subtotal = 0;
  let originalTotal = 0;
  let totalDiscount = 0;
  let totalPromotionDiscount = 0;
  const appliedPromotionsMap = new Map<string, Promotion>();

  for (const item of cartItems) {
    const product = item.product;
    if (!product) continue;

    const { finalPrice, originalPrice, hasPromotion, appliedPromotion } =
      getProductFinalPrice(product, activePromotions);

    const itemFinalTotal = finalPrice * item.quantity;
    const itemOriginalTotal = originalPrice * item.quantity;

    subtotal += itemFinalTotal;
    originalTotal += itemOriginalTotal;
    totalDiscount += (originalPrice - finalPrice) * item.quantity;

    if (hasPromotion && appliedPromotion) {
      totalPromotionDiscount += (originalPrice - finalPrice) * item.quantity;
      appliedPromotionsMap.set(appliedPromotion.id, appliedPromotion);
    }
  }

  return {
    subtotal,
    originalTotal,
    totalDiscount,
    totalPromotionDiscount,
    appliedPromotions: Array.from(appliedPromotionsMap.values()),
  };
}
