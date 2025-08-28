import { supabase } from '../lib/supabaseClient';

export interface ImageUploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage with proper authentication
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder: string = ''
): Promise<ImageUploadResult> {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { url: '', path: '', error: `Session error: ${sessionError.message}` };
    }
    
    if (!session) {
      return { url: '', path: '', error: 'No active session' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Provide user-friendly error messages
      if (uploadError.message.includes('bucket not found')) {
        return { 
          url: '', 
          path: '', 
          error: `Storage bucket '${bucket}' is not configured. Please contact your administrator.` 
        };
      }
      
      if (uploadError.message.includes('violates row-level security policy')) {
        return { 
          url: '', 
          path: '', 
          error: 'You don\'t have permission to upload images. Please check your role permissions.' 
        };
      }
      
      return { 
        url: '', 
        path: '', 
        error: `Upload failed: ${uploadError.message}` 
      };
    }

    if (!uploadData?.path) {
      return { url: '', path: '', error: 'Upload succeeded but no path returned' };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    return {
      url: publicUrlData.publicUrl,
      path: uploadData.path,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(bucket: string, path: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: `Failed to delete image: ${error.message}` };
    }

    return {};
  } catch (error) {
    console.error('Image delete error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown delete error' 
    };
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  bucket: string, 
  path: string, 
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpg';
  }
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: options ? {
        width: options.width,
        height: options.height,
        quality: options.quality,
        format: options.format,
      } : undefined
    });

  return data.publicUrl;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB.'
    };
  }

  return { valid: true };
}

/**
 * Storage bucket configurations
 */
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
  PROMOTION_IMAGES: 'promotion-images',
  USER_AVATARS: 'user-avatars',
} as const;

/**
 * Image upload presets for different use cases
 */
export const IMAGE_PRESETS = {
  PRODUCT: {
    bucket: STORAGE_BUCKETS.PRODUCT_IMAGES,
    folder: 'products',
    maxWidth: 1200,
    quality: 85,
  },
  CATEGORY: {
    bucket: STORAGE_BUCKETS.CATEGORY_IMAGES,
    folder: 'categories',
    maxWidth: 800,
    quality: 85,
  },
  PROMOTION: {
    bucket: STORAGE_BUCKETS.PROMOTION_IMAGES,
    folder: 'promotions',
    maxWidth: 1200,
    quality: 90,
  },
  AVATAR: {
    bucket: STORAGE_BUCKETS.USER_AVATARS,
    folder: 'avatars',
    maxWidth: 400,
    quality: 80,
  },
} as const;
