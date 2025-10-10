import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Image Cache Management Utility
 * Handles disk and memory caching strategies
 */

const CACHE_KEY_PREFIX = '@image_cache_';
const CACHE_METADATA_KEY = '@image_cache_metadata';
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100 MB

interface CacheMetadata {
  url: string;
  cachedAt: number;
  size: number;
  expiresAt: number;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  oldestItem?: CacheMetadata;
  newestItem?: CacheMetadata;
}

/**
 * Image Cache Manager Class
 */
class ImageCacheManager {
  private metadata: Map<string, CacheMetadata> = new Map();
  private initialized = false;

  /**
   * Initialize cache manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataJson) {
        const metadata = JSON.parse(metadataJson);
        this.metadata = new Map(Object.entries(metadata));
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Save metadata to storage
   */
  private async saveMetadata(): Promise<void> {
    try {
      const metadataObj = Object.fromEntries(this.metadata);
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadataObj));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * Add item to cache metadata
   */
  async addToCache(
    url: string,
    size: number,
    duration: number = DEFAULT_CACHE_DURATION
  ): Promise<void> {
    await this.initialize();

    const now = Date.now();
    const metadata: CacheMetadata = {
      url,
      cachedAt: now,
      size,
      expiresAt: now + duration,
    };

    this.metadata.set(url, metadata);
    await this.saveMetadata();
  }

  /**
   * Check if URL is in cache and not expired
   */
  async isInCache(url: string): Promise<boolean> {
    await this.initialize();

    const metadata = this.metadata.get(url);
    if (!metadata) return false;

    const now = Date.now();
    if (now > metadata.expiresAt) {
      // Expired, remove from cache
      this.metadata.delete(url);
      await this.saveMetadata();
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    await this.initialize();

    let totalSize = 0;
    let oldestItem: CacheMetadata | undefined;
    let newestItem: CacheMetadata | undefined;

    for (const metadata of this.metadata.values()) {
      totalSize += metadata.size;

      if (!oldestItem || metadata.cachedAt < oldestItem.cachedAt) {
        oldestItem = metadata;
      }
      if (!newestItem || metadata.cachedAt > newestItem.cachedAt) {
        newestItem = metadata;
      }
    }

    return {
      totalSize,
      itemCount: this.metadata.size,
      oldestItem,
      newestItem,
    };
  }

  /**
   * Clear expired items from cache
   */
  async clearExpired(): Promise<number> {
    await this.initialize();

    const now = Date.now();
    let clearedCount = 0;

    for (const [url, metadata] of this.metadata.entries()) {
      if (now > metadata.expiresAt) {
        this.metadata.delete(url);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      await this.saveMetadata();
    }

    return clearedCount;
  }

  /**
   * Clear cache if it exceeds size limit (LRU eviction)
   */
  async enforceSizeLimit(maxSize: number = MAX_CACHE_SIZE): Promise<number> {
    await this.initialize();

    const stats = await this.getCacheStats();
    if (stats.totalSize <= maxSize) return 0;

    // Sort by cachedAt (oldest first)
    const sortedEntries = Array.from(this.metadata.entries()).sort(
      ([, a], [, b]) => a.cachedAt - b.cachedAt
    );

    let currentSize = stats.totalSize;
    let removedCount = 0;

    for (const [url, metadata] of sortedEntries) {
      if (currentSize <= maxSize) break;

      this.metadata.delete(url);
      currentSize -= metadata.size;
      removedCount++;
    }

    if (removedCount > 0) {
      await this.saveMetadata();
    }

    return removedCount;
  }

  /**
   * Clear all cache data
   */
  async clearAll(): Promise<void> {
    await this.initialize();

    this.metadata.clear();
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);

    // Clear expo-image cache
    await Image.clearDiskCache();
    await Image.clearMemoryCache();

    console.log('✅ All image cache cleared');
  }

  /**
   * Get cache metadata for a URL
   */
  async getMetadata(url: string): Promise<CacheMetadata | undefined> {
    await this.initialize();
    return this.metadata.get(url);
  }
}

// Singleton instance
export const imageCacheManager = new ImageCacheManager();

/**
 * Prefetch and cache image
 */
export const prefetchImage = async (
  url: string,
  options?: {
    duration?: number;
    estimatedSize?: number;
  }
): Promise<boolean> => {
  try {
    // Check if already cached
    const isCached = await imageCacheManager.isInCache(url);
    if (isCached) {
      console.log('Image already in cache:', url);
      return true;
    }

    // Prefetch the image
    await Image.prefetch(url);

    // Add to cache metadata
    await imageCacheManager.addToCache(
      url,
      options?.estimatedSize || 0,
      options?.duration
    );

    console.log('Image prefetched and cached:', url);
    return true;
  } catch (error) {
    console.error('Failed to prefetch image:', error);
    return false;
  }
};

/**
 * Prefetch multiple images
 */
export const prefetchImages = async (
  urls: string[],
  options?: {
    duration?: number;
    estimatedSize?: number;
    maxConcurrent?: number;
  }
): Promise<{ success: number; failed: number }> => {
  const maxConcurrent = options?.maxConcurrent || 5;
  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const results = await Promise.allSettled(
      batch.map(url => prefetchImage(url, options))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        success++;
      } else {
        failed++;
      }
    });
  }

  return { success, failed };
};

/**
 * Schedule periodic cache cleanup
 */
export const scheduleCacheCleanup = (intervalMs: number = 24 * 60 * 60 * 1000): () => void => {
  const cleanup = async () => {
    console.log('Running scheduled cache cleanup...');

    const expiredCount = await imageCacheManager.clearExpired();
    const evictedCount = await imageCacheManager.enforceSizeLimit();

    console.log(`Cache cleanup complete: ${expiredCount} expired, ${evictedCount} evicted`);
  };

  // Run immediately
  cleanup();

  // Schedule periodic cleanup
  const intervalId = setInterval(cleanup, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Get formatted cache size
 */
export const getFormattedCacheSize = async (): Promise<string> => {
  const stats = await imageCacheManager.getCacheStats();
  const bytes = stats.totalSize;

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default imageCacheManager;
