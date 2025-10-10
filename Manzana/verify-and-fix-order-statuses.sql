-- COMPLETE ORDER STATUS FIX
-- Run this entire script in Supabase SQL Editor

-- 1. First, check current constraint
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'orders_status_check';

-- 2. Drop ALL existing status constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS status_check;

-- 3. Add the new comprehensive constraint
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'processing',
    'ready',
    'shipped',
    'delivered',
    'completed',
    'cancelled'
  ));

-- 4. Verify it was added correctly
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'orders_status_check';

-- 5. Test update (should succeed)
-- Replace 'YOUR_ORDER_ID' with an actual order ID from your database
-- UPDATE orders SET status = 'preparing' WHERE id = 'YOUR_ORDER_ID';

-- 6. Check current order statuses
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 7. Check if there are any RLS policies that might be blocking updates
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders';
