import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { optimizeImageUrl } from '../services/imageOptimization';

interface PreloadOptions {
  width?: number;
  height?: number;
  quality?: number;
  enabled?: boolean;
}

/**
 * Hook to preload images for better performance
 */
export const useImagePreloader = (
  urls: string[],
  options: PreloadOptions = {}
) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const {
    width,
    height,
    quality = 85,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || urls.length === 0) return;

    const preloadImages = async () => {
      setIsPreloading(true);
      setPreloadedCount(0);
      setErrors([]);

      const preloadPromises = urls.map(async (url, index) => {
        try {
          const optimizedUrl = optimizeImageUrl(url, {
            width,
            height,
            quality,
          });

          await Image.prefetch(optimizedUrl);
          setPreloadedCount(prev => prev + 1);
        } catch (error) {
          console.error(`Failed to preload image ${index}:`, error);
          setErrors(prev => [...prev, url]);
        }
      });

      await Promise.allSettled(preloadPromises);
      setIsPreloading(false);
    };

    preloadImages();
  }, [urls, width, height, quality, enabled]);

  return {
    isPreloading,
    preloadedCount,
    totalImages: urls.length,
    progress: urls.length > 0 ? (preloadedCount / urls.length) * 100 : 0,
    errors,
    isComplete: !isPreloading && preloadedCount === urls.length,
  };
};

/**
 * Hook to preload product images
 */
export const useProductImagesPreloader = (
  products: Array<{ images?: Array<{ url: string }> }>,
  options: PreloadOptions = {}
) => {
  const imageUrls = products
    .flatMap(product => product.images?.map(img => img.url) || [])
    .filter(Boolean);

  return useImagePreloader(imageUrls, options);
};

export default useImagePreloader;
