-- ========================================
-- COMPLETE DATABASE FIX FOR MANZANA APP
-- ========================================
-- This fixes user registration and profile data fetching issues
-- Run this entire script in your Supabase SQL Editor

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing problematic policies and triggers
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_user_id_trigger ON users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS set_user_id_from_auth();

-- 3. Ensure users table has correct structure
-- Remove default UUID generation since we'll use auth.uid()
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- 4. Create comprehensive RLS policies for users table
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to insert their own profile (during registration)
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow users to delete their own profile (optional)
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- 5. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with data from auth.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        user_type,
        notification_preferences,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'consumer'),
        COALESCE(
            NEW.raw_user_meta_data->'notification_preferences',
            '{
                "push_promotions": true,
                "push_stock_alerts": true,
                "push_new_products": true,
                "email_promotions": true,
                "email_stock_alerts": true
            }'::jsonb
        ),
        true,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for automatic profile creation on auth user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- 8. Fix any existing users that might not have profiles
-- This will create profiles for any auth users that don't have them
INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type,
    notification_preferences,
    is_active,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'user_type', 'consumer'),
    '{
        "push_promotions": true,
        "push_stock_alerts": true,
        "push_new_products": true,
        "email_promotions": true,
        "email_stock_alerts": true
    }'::jsonb,
    true,
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Ensure other tables have proper RLS policies
-- Categories (public read access)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (is_active = true);

-- Products (public read access)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true);

-- Promotions (public read access)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promotions are viewable by everyone" ON promotions;
CREATE POLICY "Promotions are viewable by everyone" ON promotions
    FOR SELECT USING (is_active = true);

-- Notifications (users can only see their own)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the fix worked:

-- Check if RLS policies are in place
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('users', 'categories', 'products', 'promotions', 'notifications');

-- Check if trigger exists
-- SELECT tgname, proname 
-- FROM pg_trigger t 
-- JOIN pg_proc p ON t.tgfoid = p.oid 
-- WHERE tgname = 'on_auth_user_created';

-- Check users table structure
-- \d users;

-- Test user profile creation (replace with actual user ID)
-- SELECT id, email, full_name, user_type FROM users WHERE id = auth.uid();

NOTIFY pgsql, 'Database fix completed successfully!';
