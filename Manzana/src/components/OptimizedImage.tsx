import React from 'react';
import { Image } from 'expo-image';
import { COLORS } from '../constants/theme';

interface OptimizedImageProps {
  uri: string;
  width: number;
  height: number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

/**
 * OptimizedImage Component
 * Uses expo-image for better performance with caching and optimization
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  width,
  height,
  style,
  contentFit = 'cover',
  placeholder,
  priority = 'normal',
  cachePolicy = 'memory-disk',
}) => {
  // Generate optimized URL with size parameters
  const optimizedUri = uri && uri.includes('supabase')
    ? `${uri}?width=${Math.round(width)}&height=${Math.round(height)}&quality=85`
    : uri || 'https://via.placeholder.com/400';

  return (
    <Image
      source={{ uri: optimizedUri }}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      placeholder={placeholder}
      priority={priority}
      cachePolicy={cachePolicy}
      transition={200}
      placeholderContentFit="cover"
    />
  );
};

export default OptimizedImage;
