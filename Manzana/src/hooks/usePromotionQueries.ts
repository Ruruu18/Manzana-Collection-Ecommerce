import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Promotion, Category } from '../types';

/**
 * Query Keys
 */
export const promotionKeys = {
  all: ['promotions'] as const,
  featured: (userType?: string) => [...promotionKeys.all, 'featured', userType || 'guest'] as const,
  detail: (id: string) => [...promotionKeys.all, 'detail', id] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  active: () => [...categoryKeys.all, 'active'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
};

/**
 * Fetch featured promotions (active + upcoming) with caching
 */
export const useFeaturedPromotions = (userType?: string) => {
  return useQuery({
    queryKey: promotionKeys.featured(userType),
    queryFn: async () => {
      const now = new Date().toISOString();
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch active promotions
      let activeQuery = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      // Fetch upcoming promotions
      let upcomingQuery = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gt('start_date', now)
        .lte('start_date', sevenDaysFromNow);

      // Filter by user type if provided
      if (userType) {
        activeQuery = activeQuery.or(
          `user_type_restriction.is.null,user_type_restriction.eq.${userType}`
        );
        upcomingQuery = upcomingQuery.or(
          `user_type_restriction.is.null,user_type_restriction.eq.${userType}`
        );
      }

      const [activeResult, upcomingResult] = await Promise.all([
        activeQuery,
        upcomingQuery,
      ]);

      if (activeResult.error) throw activeResult.error;
      if (upcomingResult.error) throw upcomingResult.error;

      // Combine and sort
      const activePromotions = (activeResult.data || []).map((p: Promotion) => ({
        ...p,
        isActive: true,
      }));
      const upcomingPromotions = (upcomingResult.data || [])
        .map((p: Promotion) => ({ ...p, isActive: false }))
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      return [...activePromotions, ...upcomingPromotions].slice(0, 5);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch promotion by ID with caching
 */
export const usePromotion = (promotionId: string | undefined) => {
  return useQuery({
    queryKey: promotionKeys.detail(promotionId || ''),
    queryFn: async () => {
      if (!promotionId) throw new Error('Promotion ID is required');

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    enabled: !!promotionId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch active parent categories with caching (for home screen)
 */
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('level', 0) // Only fetch parent categories
        .order('display_order', { ascending: true })
        .order('name')
        .limit(8);

      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000, // Categories change infrequently - cache for 10 minutes
  });
};

/**
 * Fetch active parent categories with their subcategories
 */
export const useCategoriesWithSubcategories = () => {
  return useQuery({
    queryKey: [...categoryKeys.all, 'with-subcategories'] as const,
    queryFn: async () => {
      // Fetch all active categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('display_order', { ascending: true })
        .order('name');

      if (error) throw error;

      const allCategories = (data || []) as Category[];

      // Organize into hierarchical structure
      const parents = allCategories.filter((cat) => cat.level === 0);
      const children = allCategories.filter((cat) => cat.level === 1);

      // Add subcategories to parents
      return parents.map((parent) => ({
        ...parent,
        subcategories: children.filter(
          (child) => child.parent_category_id === parent.id
        ),
      }));
    },
    staleTime: 10 * 60 * 1000, // Categories change infrequently - cache for 10 minutes
  });
};

/**
 * Fetch category by ID with caching
 */
export const useCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data as Category;
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
