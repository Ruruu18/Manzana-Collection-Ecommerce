-- ================================
-- RESET/DROP ALL EXISTING TABLES
-- ================================
-- This script will remove all existing tables and data
-- Run this in Supabase SQL editor BEFORE running the new schema

-- Disable triggers first to avoid conflicts
SET session_replication_role = replica;

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
DROP TRIGGER IF EXISTS update_stock_alerts_updated_at ON public.stock_alerts;
DROP TRIGGER IF EXISTS update_cart_updated_at ON public.cart;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
DROP TRIGGER IF EXISTS check_stock_alerts_trigger ON public.products;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON public.product_images;
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Active promotions are viewable by everyone" ON public.promotions;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON public.reviews;

-- Admin policies
DROP POLICY IF EXISTS admin_insert_products ON public.products;
DROP POLICY IF EXISTS admin_update_products ON public.products;
DROP POLICY IF EXISTS admin_delete_products ON public.products;
DROP POLICY IF EXISTS admin_insert_product_images ON public.product_images;
DROP POLICY IF EXISTS admin_delete_product_images ON public.product_images;
DROP POLICY IF EXISTS admin_insert_promotions ON public.promotions;
DROP POLICY IF EXISTS admin_update_promotions ON public.promotions;
DROP POLICY IF EXISTS admin_delete_promotions ON public.promotions;
DROP POLICY IF EXISTS admin_insert_categories ON public.categories;
DROP POLICY IF EXISTS admin_update_categories ON public.categories;
DROP POLICY IF EXISTS admin_delete_categories ON public.categories;

-- Storage policies
DROP POLICY IF EXISTS public_read_product_images ON storage.objects;
DROP POLICY IF EXISTS public_read_promotion_images ON storage.objects;
DROP POLICY IF EXISTS admin_write_product_images ON storage.objects;
DROP POLICY IF EXISTS admin_update_product_images ON storage.objects;
DROP POLICY IF EXISTS admin_delete_product_images_storage ON storage.objects;
DROP POLICY IF EXISTS admin_write_promotion_images ON storage.objects;
DROP POLICY IF EXISTS admin_update_promotion_images ON storage.objects;
DROP POLICY IF EXISTS admin_delete_promotion_images_storage ON storage.objects;

-- Drop all tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.staff_permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS order_sequence CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.check_stock_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.create_staff_account(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_staff(UUID) CASCADE;

-- Clean storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('product-images', 'promotion-images');
DELETE FROM storage.buckets WHERE id IN ('product-images', 'promotion-images');

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Display completion message
SELECT 'Database reset complete! All tables, policies, triggers, and functions have been removed.' as message;
