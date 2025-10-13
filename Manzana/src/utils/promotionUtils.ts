import { Product, Promotion } from '../types';

export interface PromotionPriceResult {
  originalPrice: number;
  discountedPrice: number | null;
  promotionPrice: number | null;
  finalPrice: number;
  appliedPromotion: Promotion | null;
  savingsAmount: number;
  savingsPercentage: number;
}

/**
 * Calculate the final price of a product considering both discounted_price and active promotions
 * Priority: base price → discounted_price → promotion discount
 */
export function calculatePromotionPrice(
  product: Product,
  activePromotions: Promotion[]
): PromotionPriceResult {
  const originalPrice = product.price;
  const discountedPrice = product.discounted_price || null;

  // Start with discounted price if available, otherwise original price
  let currentPrice = discountedPrice || originalPrice;
  let appliedPromotion: Promotion | null = null;
  let promotionPrice: number | null = null;

  // Find applicable promotions for this product
  const applicablePromotions = activePromotions.filter((promo) => {
    if (!promo.is_active) return false;

    // Check if promotion is currently active (date range)
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    if (now < startDate || now > endDate) return false;

    // Check if promotion applies to this product
    if (promo.applicable_to === 'all') return true;
    if (promo.applicable_to === 'product' && promo.applicable_ids.includes(product.id)) return true;
    if (promo.applicable_to === 'category' && promo.applicable_ids.includes(product.category_id)) return true;

    return false;
  });

  // Apply the best promotion (highest discount)
  if (applicablePromotions.length > 0) {
    let bestDiscount = 0;
    let bestPromo: Promotion | null = null;

    applicablePromotions.forEach((promo) => {
      let discount = 0;

      if (promo.promotion_type === 'percentage') {
        discount = currentPrice * (promo.discount_value / 100);
      } else if (promo.promotion_type === 'fixed_amount') {
        discount = promo.discount_value;
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestPromo = promo;
      }
    });

    if (bestPromo && bestDiscount > 0) {
      promotionPrice = Math.max(0, currentPrice - bestDiscount);
      appliedPromotion = bestPromo;
      currentPrice = promotionPrice;
    }
  }

  const finalPrice = currentPrice;
  const savingsAmount = originalPrice - finalPrice;
  const savingsPercentage = originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;

  return {
    originalPrice,
    discountedPrice,
    promotionPrice,
    finalPrice,
    appliedPromotion,
    savingsAmount,
    savingsPercentage,
  };
}

/**
 * Calculate time remaining until promotion ends
 */
export function getPromotionTimeRemaining(endDate: string): {
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
} {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      formatted: 'Expired',
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    formatted,
  };
}

/**
 * Get promotion badge text
 */
export function getPromotionBadgeText(promotion: Promotion): string {
  if (promotion.promotion_type === 'percentage') {
    return `-${promotion.discount_value}%`;
  } else if (promotion.promotion_type === 'fixed_amount') {
    return `-₱${promotion.discount_value}`;
  } else if (promotion.promotion_type === 'buy_x_get_y') {
    return `${promotion.buy_quantity}+${promotion.get_quantity}`;
  }
  return 'PROMO';
}

/**
 * Check if promotion is ending soon (within 24 hours)
 */
export function isPromotionEndingSoon(endDate: string): boolean {
  const { totalSeconds } = getPromotionTimeRemaining(endDate);
  return totalSeconds > 0 && totalSeconds <= 24 * 60 * 60; // 24 hours
}

/**
 * Check if promotion has just started (within 24 hours)
 */
export function isPromotionNew(startDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const diff = now.getTime() - start.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours >= 0 && hours <= 24;
}
