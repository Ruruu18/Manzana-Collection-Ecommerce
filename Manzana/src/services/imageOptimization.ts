import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Image Optimization Service
 * Handles CDN integration, caching, and image transformations
 */

// CDN Configuration
const CDN_PROVIDERS = {
  cloudinary: 'https://res.cloudinary.com',
  imgix: 'https://imgix.net',
  cloudflare: 'https://imagedelivery.net',
  supabase: 'supabase.co/storage',
  bunny: 'https://cdn.bunny.net'
} as const;

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  progressive?: boolean;
  cdn?: keyof typeof CDN_PROVIDERS | 'auto';
}

interface CacheConfig {
  maxAge?: number; // in seconds
  priority?: 'low' | 'normal' | 'high';
  disk?: boolean;
  memory?: boolean;
}

/**
 * Detect CDN provider from URL
 */
const detectCDNProvider = (url: string): keyof typeof CDN_PROVIDERS | null => {
  if (!url) return null;

  for (const [provider, domain] of Object.entries(CDN_PROVIDERS)) {
    if (url.includes(domain)) {
      return provider as keyof typeof CDN_PROVIDERS;
    }
  }
  return null;
};

/**
 * Optimize image URL with CDN transformations
 */
export const optimizeImageUrl = (
  url: string,
  options: ImageOptimizationOptions = {}
): string => {
  if (!url) return '';

  const {
    width,
    height,
    quality = 85,
    format = 'auto',
    fit = 'cover',
    blur,
    progressive = true,
    cdn = 'auto'
  } = options;

  const provider = cdn === 'auto' ? detectCDNProvider(url) : cdn;

  // Apply provider-specific transformations
  switch (provider) {
    case 'cloudinary':
      return buildCloudinaryUrl(url, { width, height, quality, format, fit, blur, progressive });

    case 'imgix':
      return buildImgixUrl(url, { width, height, quality, format, fit, blur });

    case 'bunny':
      return buildBunnyUrl(url, { width, height, quality, format });

    case 'supabase':
      return buildSupabaseUrl(url, { width, height, quality });

    default:
      // Generic URL parameters for unknown providers
      return buildGenericUrl(url, { width, height, quality });
  }
};

/**
 * Build Cloudinary optimized URL
 */
const buildCloudinaryUrl = (url: string, options: ImageOptimizationOptions): string => {
  const { width, height, quality, format, fit, blur, progressive } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format && format !== 'auto') transformations.push(`f_${format}`);
  if (fit) transformations.push(`c_${fit}`);
  if (blur) transformations.push(`e_blur:${blur}`);
  if (progressive) transformations.push('fl_progressive');

  // Add auto format and quality if not specified
  if (format === 'auto') transformations.push('f_auto');
  transformations.push('q_auto:good');

  const transformString = transformations.join(',');

  // Insert transformations into Cloudinary URL
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  return url;
};

/**
 * Build Imgix optimized URL
 */
const buildImgixUrl = (url: string, options: ImageOptimizationOptions): string => {
  const { width, height, quality, format, fit, blur } = options;

  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  if (format && format !== 'auto') params.append('fm', format);
  if (fit) params.append('fit', fit);
  if (blur) params.append('blur', blur.toString());

  // Add auto format if not specified
  if (format === 'auto') params.append('auto', 'format,compress');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/**
 * Build Bunny CDN optimized URL
 */
const buildBunnyUrl = (url: string, options: ImageOptimizationOptions): string => {
  const { width, height, quality, format } = options;

  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format && format !== 'auto') params.append('format', format);

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/**
 * Build Supabase Storage optimized URL
 */
const buildSupabaseUrl = (url: string, options: ImageOptimizationOptions): string => {
  const { width, height, quality } = options;

  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/**
 * Build generic URL with query parameters
 */
const buildGenericUrl = (url: string, options: ImageOptimizationOptions): string => {
  const { width, height, quality } = options;

  const params = new URLSearchParams();

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());

  const paramString = params.toString();
  if (!paramString) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramString}`;
};

/**
 * Preload images for better UX
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(
      urls.map(url => ExpoImage.prefetch(url))
    );
  } catch (error) {
    console.error('Error preloading images:', error);
  }
};

/**
 * Clear image cache
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    await ExpoImage.clearDiskCache();
    await ExpoImage.clearMemoryCache();
    console.log('✅ Image cache cleared successfully');
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
};

/**
 * Get cache size
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    if (Platform.OS === 'web') return 0;

    const cacheDir = `${FileSystem.cacheDirectory}ImageCache`;
    const info = await FileSystem.getInfoAsync(cacheDir);

    if (info.exists && info.isDirectory) {
      // This is a rough estimate, would need to recursively check files
      return 0; // expo-image doesn't expose cache size directly
    }

    return 0;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Generate responsive image URLs for different screen densities
 */
export const generateResponsiveUrls = (
  url: string,
  baseWidth: number
): { [key: string]: string } => {
  return {
    '1x': optimizeImageUrl(url, { width: baseWidth }),
    '2x': optimizeImageUrl(url, { width: baseWidth * 2 }),
    '3x': optimizeImageUrl(url, { width: baseWidth * 3 }),
  };
};

/**
 * Get optimal image dimensions based on container size and device pixel ratio
 */
export const getOptimalDimensions = (
  containerWidth: number,
  containerHeight?: number,
  pixelRatio: number = 2
): { width: number; height?: number } => {
  return {
    width: Math.round(containerWidth * pixelRatio),
    height: containerHeight ? Math.round(containerHeight * pixelRatio) : undefined,
  };
};

/**
 * Image blurhash placeholder utility
 */
export const getBlurhashPlaceholder = (blurhash?: string): string | undefined => {
  // Return blurhash if available for expo-image
  return blurhash;
};

/**
 * Calculate aspect ratio from dimensions
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Get dimensions from aspect ratio and width
 */
export const getDimensionsFromAspectRatio = (
  width: number,
  aspectRatio: number
): { width: number; height: number } => {
  return {
    width,
    height: Math.round(width / aspectRatio),
  };
};

export default {
  optimizeImageUrl,
  preloadImages,
  clearImageCache,
  getCacheSize,
  generateResponsiveUrls,
  getOptimalDimensions,
  getBlurhashPlaceholder,
  calculateAspectRatio,
  getDimensionsFromAspectRatio,
};
