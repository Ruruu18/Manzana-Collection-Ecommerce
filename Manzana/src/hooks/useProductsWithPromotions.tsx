import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Product, Promotion } from '../types';
import { calculatePromotionPrice } from '../utils/promotionUtils';

/**
 * Fetch all active promotions (currently running)
 */
export const useActivePromotions = (userType?: string) => {
  return useQuery({
    queryKey: ['promotions', 'active', userType],
    queryFn: async () => {
      const now = new Date().toISOString();

      let query = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      // Filter by user type if provided
      if (userType) {
        query = query.or(
          `user_type_restriction.is.null,user_type_restriction.eq.${userType}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching active promotions:', error);
        throw error;
      }

      console.log(`🎯 Found ${data?.length || 0} active promotions for user type: ${userType || 'all'}`);
      return (data || []) as Promotion[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - promotions change frequently
  });
};

/**
 * Enrich products with promotional pricing
 * This will calculate final prices based on active promotions
 */
export const useProductsWithPromotions = (products: Product[], userType?: string) => {
  const { data: activePromotions = [], isLoading } = useActivePromotions(userType);

  const enrichedProducts = useMemo(() => {
    if (isLoading || !products || products.length === 0) {
      return products;
    }

    console.log(`💰 Enriching ${products.length} products with ${activePromotions.length} active promotions`);

    return products.map((product) => {
      const priceResult = calculatePromotionPrice(product, activePromotions);

      // If there's a promotion applied, update the product's discounted_price
      if (priceResult.appliedPromotion && priceResult.promotionPrice !== null) {
        console.log(`✅ Applied promotion to ${product.name}: ${priceResult.originalPrice} → ${priceResult.finalPrice} (${priceResult.appliedPromotion.title})`);

        return {
          ...product,
          discounted_price: priceResult.finalPrice,
          // Store promotion info in product for reference
          applied_promotion: priceResult.appliedPromotion,
          savings: priceResult.savingsAmount,
          savings_percentage: priceResult.savingsPercentage,
        };
      }

      // No promotion, return product as-is
      return product;
    });
  }, [products, activePromotions, isLoading]);

  return {
    products: enrichedProducts,
    isLoading,
    activePromotions,
  };
};
