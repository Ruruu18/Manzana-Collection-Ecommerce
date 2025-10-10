-- Update orders table to include all order statuses
-- This adds 'processing', 'shipped', 'delivered' alongside existing statuses

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all statuses (both old and new)
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

-- Update any existing 'processing' orders to 'preparing' for consistency
-- (Optional - uncomment if you want to migrate old data)
-- UPDATE orders SET status = 'preparing' WHERE status = 'processing';
-- UPDATE orders SET status = 'ready' WHERE status = 'shipped';
-- UPDATE orders SET status = 'completed' WHERE status = 'delivered';

-- Verify the constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'orders_status_check';
