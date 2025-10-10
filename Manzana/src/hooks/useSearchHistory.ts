import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@manzana_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load search history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      // Remove duplicates and add to beginning, limit to MAX_HISTORY_ITEMS
      const normalized = query.trim().toLowerCase();
      const filtered = history.filter(
        (item) => item.toLowerCase() !== normalized
      );
      const updated = [query.trim(), ...filtered].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch (error) {
      // Silent fail
    }
  };

  const removeSearch = async (query: string) => {
    try {
      const updated = history.filter((item) => item !== query);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch (error) {
      // Silent fail
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      // Silent fail
    }
  };

  return {
    history,
    loading,
    saveSearch,
    removeSearch,
    clearHistory,
  };
};
