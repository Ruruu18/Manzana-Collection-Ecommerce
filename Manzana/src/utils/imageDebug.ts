// Image debugging utility
import { supabase } from '../services/supabase';

export const debugImageLoading = async () => {
  console.log('🔍 Starting image debug...');
  
  try {
    // Test 1: Check if we can fetch products with images
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        images:product_images(id, url, alt_text, is_primary)
      `)
      .limit(3);

    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }

    console.log('📦 Products fetched:', products?.length || 0);
    
    products?.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name}`);
      console.log('  Images:', product.images?.length || 0);
      
      product.images?.forEach((image: any, imgIndex: number) => {
        console.log(`    Image ${imgIndex + 1}:`, {
          id: image.id,
          url: image.url,
          isPrimary: image.is_primary,
          urlLength: image.url?.length || 0,
          urlStartsWith: image.url?.substring(0, 50) || 'N/A'
        });
      });
    });

    // Test 2: Check Supabase storage configuration
    console.log('🔧 Supabase client initialized');
    
    // Test 3: Try to get a public URL for storage
    if (products?.[0]?.images?.[0]?.url) {
      const firstImageUrl = products[0].images[0].url;
      console.log('🖼️ First image URL analysis:', {
        fullUrl: firstImageUrl,
        isSupabaseUrl: firstImageUrl.includes('supabase'),
        isHttps: firstImageUrl.startsWith('https://'),
        urlParts: firstImageUrl.split('/').slice(0, 5)
      });
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

// Test image URL accessibility
export const testImageUrl = async (url: string) => {
  console.log('🧪 Testing image URL:', url);
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('✅ Image URL test result:', {
      status: response.status,
      statusText: response.statusText,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        cacheControl: response.headers.get('cache-control')
      }
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Image URL test failed:', error);
    return false;
  }
};