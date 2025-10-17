import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Product } from '../types';
import { sortProductsWithImages } from '../utils';

/**
 * Query Keys - centralized for consistency
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  new: () => [...productKeys.all, 'new'] as const,
  category: (categoryId: string) => [...productKeys.all, 'category', categoryId] as const,
  similar: (productId: string, categoryId: string) =>
    [...productKeys.all, 'similar', productId, categoryId] as const,
};

/**
 * Fetch product by ID with caching
 */
export const useProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: productKeys.detail(productId || ''),
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_images(id, url, alt_text, is_primary, sort_order),
          product_variants(id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Sort images
      if (data.product_images) {
        data.product_images.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return a.sort_order - b.sort_order;
        });
      }

      return {
        ...data,
        images: data.product_images || [],
        variants: data.product_variants || []
      } as Product;
    },
    enabled: !!productId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
};

/**
 * Fetch featured products with caching
 */
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary),
          variants:product_variants(id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return sortProductsWithImages(data || []) as Product[];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
};

/**
 * Fetch new products with caching
 */
export const useNewProducts = () => {
  return useQuery({
    queryKey: productKeys.new(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary),
          variants:product_variants(id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return sortProductsWithImages(data || []) as Product[];
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
};

/**
 * Fetch similar products (same category) with caching
 */
export const useSimilarProducts = (productId: string | undefined, categoryId: string | undefined) => {
  return useQuery({
    queryKey: productKeys.similar(productId || '', categoryId || ''),
    queryFn: async () => {
      if (!productId || !categoryId) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_images(id, url, alt_text, is_primary, sort_order),
          product_variants(id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', productId)
        .limit(10);

      if (error) throw error;

      const processedProducts = data?.map((p: any) => {
        const sortedImages = p.product_images?.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return a.sort_order - b.sort_order;
        }) || [];

        return {
          ...p,
          images: sortedImages,
          variants: p.product_variants || []
        };
      }) || [];

      return processedProducts as Product[];
    },
    enabled: !!productId && !!categoryId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
};

/**
 * Fetch products by category with caching
 */
export const useProductsByCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: productKeys.category(categoryId || ''),
    queryFn: async () => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          images:product_images(id, url, alt_text, is_primary),
          variants:product_variants(id, name, type, value, stock_quantity, price_adjustment, sku_suffix, is_active)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return sortProductsWithImages(data || []) as Product[];
    },
    enabled: !!categoryId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
};
