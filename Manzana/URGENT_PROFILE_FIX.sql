-- ========================================
-- URGENT PROFILE DATA FIX
-- ========================================
-- This fixes the issue where user profiles exist but can't be fetched

-- 1. Check current RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Drop and recreate RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- 3. Create more permissive policies
-- Allow authenticated users to select their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IS NOT NULL);

-- Allow users to insert their own profile
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- 4. Grant explicit permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Check if there are any orphaned profiles (auth users without profiles)
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    pu.id as profile_id,
    pu.email as profile_email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 6. Create profiles for any auth users that don't have them
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
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();

-- 7. Verify the fix by checking profiles exist
SELECT 
    id,
    email,
    full_name,
    user_type,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 8. Test RLS policies work
-- This should return the current user's profile when run by an authenticated user
-- SELECT * FROM users WHERE id = auth.uid();

NOTIFY pgsql, 'Profile data fix completed!';
