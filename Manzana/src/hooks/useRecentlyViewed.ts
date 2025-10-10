import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

const RECENTLY_VIEWED_KEY = '@manzana_recently_viewed';
const MAX_RECENT_ITEMS = 20;

export const useRecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const addRecentProduct = async (product: Product) => {
    try {
      // Remove if already exists to avoid duplicates
      const filtered = recentProducts.filter((p) => p.id !== product.id);

      // Add to beginning and limit to MAX_RECENT_ITEMS
      const updated = [product, ...filtered].slice(0, MAX_RECENT_ITEMS);

      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      setRecentProducts(updated);
    } catch (error) {
      // Silent fail
    }
  };

  const clearRecentlyViewed = async () => {
    try {
      await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
      setRecentProducts([]);
    } catch (error) {
      // Silent fail
    }
  };

  return {
    recentProducts,
    loading,
    addRecentProduct,
    clearRecentlyViewed,
  };
};
