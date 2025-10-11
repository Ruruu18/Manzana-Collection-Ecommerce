-- ================================
-- FIX PICKUP ORDER STATUS VALUES (CORRECTED VERSION)
-- ================================
-- This updates the orders table to support proper pickup order statuses
-- IMPORTANT: Migrates data FIRST, then updates constraints

-- Step 1: Check what statuses currently exist in the database
DO $$
BEGIN
    RAISE NOTICE '📊 Current status values in orders table:';
END $$;

SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Step 2: Migrate existing data BEFORE changing constraint
-- Change 'shipped' to 'ready'
UPDATE orders SET status = 'ready' WHERE status = 'shipped';

-- Change 'delivered' to 'completed'
UPDATE orders SET status = 'completed' WHERE status = 'delivered';

-- Step 3: Show what was migrated
DO $$
BEGIN
    RAISE NOTICE '✅ Data migration complete. New status distribution:';
END $$;

SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Step 4: Now it's safe to drop and recreate the constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 5: Add new status constraint with pickup-friendly values
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'pending',      -- Order placed, awaiting confirmation
        'confirmed',    -- Order confirmed by staff
        'processing',   -- Order being prepared
        'ready',        -- Ready for pickup (was 'shipped')
        'completed',    -- Picked up (was 'delivered')
        'cancelled'     -- Order cancelled
    ));

-- Step 6: Update the notification trigger function
DROP FUNCTION IF EXISTS notify_order_status_change() CASCADE;

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT := 'order_update';
    pickup_info TEXT := '';
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN

        -- Build pickup time info if available
        IF NEW.pickup_date IS NOT NULL THEN
            pickup_info := ' on ' || TO_CHAR(NEW.pickup_date::timestamp, 'Mon DD, YYYY');
            IF NEW.pickup_time IS NOT NULL THEN
                pickup_info := pickup_info || ' at ' || NEW.pickup_time;
            END IF;
        END IF;

        -- Determine notification content based on new status
        CASE NEW.status
            WHEN 'confirmed' THEN
                notification_title := '✅ Order Confirmed!';
                notification_message := 'Your order ' || NEW.order_number || ' has been confirmed. We are preparing your items.';

            WHEN 'processing' THEN
                notification_title := '📦 Order Processing';
                notification_message := 'Your order ' || NEW.order_number || ' is being processed and prepared for pickup.';

            WHEN 'ready' THEN
                notification_title := '🎉 Order Ready for Pickup!';
                IF pickup_info != '' THEN
                    notification_message := 'Your order ' || NEW.order_number || ' is ready! Please pick it up' || pickup_info || '.';
                ELSE
                    notification_message := 'Your order ' || NEW.order_number || ' is ready for pickup!';
                END IF;

            WHEN 'completed' THEN
                notification_title := '✨ Order Completed';
                notification_message := 'Thank you for picking up order ' || NEW.order_number || '! We hope to see you again soon.';

            WHEN 'cancelled' THEN
                notification_title := '❌ Order Cancelled';
                notification_message := 'Your order ' || NEW.order_number || ' has been cancelled.';

            ELSE
                -- For any other status, create a generic notification
                notification_title := '📋 Order Status Updated';
                notification_message := 'Your order ' || NEW.order_number || ' status has been updated to: ' || NEW.status || '.';
        END CASE;

        -- Insert notification for the customer
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            is_read,
            created_at
        ) VALUES (
            NEW.user_id,
            notification_type,
            notification_title,
            notification_message,
            jsonb_build_object(
                'order_id', NEW.id,
                'order_number', NEW.order_number,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'pickup_date', NEW.pickup_date,
                'pickup_time', NEW.pickup_time
            ),
            false,
            NOW()
        );

        -- Log the notification creation
        RAISE NOTICE '✅ Order notification: % (% → %)', NEW.order_number, OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Recreate the trigger
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_order_status_change();

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO service_role;

-- Step 9: Add pickup-specific columns if they don't exist
DO $$
BEGIN
    -- Add pickup_date if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'pickup_date'
    ) THEN
        ALTER TABLE orders ADD COLUMN pickup_date DATE;
        RAISE NOTICE '✅ Added pickup_date column';
    END IF;

    -- Add pickup_time if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'pickup_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN pickup_time VARCHAR(20);
        RAISE NOTICE '✅ Added pickup_time column';
    END IF;

    -- Add pickup_notes if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'pickup_notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN pickup_notes TEXT;
        RAISE NOTICE '✅ Added pickup_notes column';
    END IF;

    -- Add payment_method_pickup if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'payment_method_pickup'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method_pickup VARCHAR(50);
        RAISE NOTICE '✅ Added payment_method_pickup column';
    END IF;
END $$;

-- Step 10: Create index for pickup orders
CREATE INDEX IF NOT EXISTS idx_orders_status_pickup
    ON orders(status, pickup_date)
    WHERE pickup_date IS NOT NULL;

-- Step 11: Add comments for clarity
COMMENT ON COLUMN orders.status IS
    'Order status for PICKUP orders: pending (new) → confirmed (accepted) → processing (preparing) → ready (ready for pickup) → completed (picked up) | cancelled';

COMMENT ON TRIGGER order_status_notification_trigger ON orders IS
    'Sends notification to customer when order status changes. Uses pickup-friendly status names (ready, completed).';

-- Step 12: Final verification
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check if any orders have invalid status
    SELECT COUNT(*) INTO invalid_count
    FROM orders
    WHERE status NOT IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION '❌ Found % orders with invalid status values! Please check and fix manually.', invalid_count;
    ELSE
        RAISE NOTICE '✅✅✅ SUCCESS! Pickup order statuses updated successfully! ✅✅✅';
        RAISE NOTICE '';
        RAISE NOTICE '📋 New status flow: pending → confirmed → processing → ready → completed';
        RAISE NOTICE '';
        RAISE NOTICE '✅ "shipped" has been renamed to "ready" (Ready for Pickup)';
        RAISE NOTICE '✅ "delivered" has been renamed to "completed" (Picked Up)';
        RAISE NOTICE '';
        RAISE NOTICE '🎉 All notifications will now use pickup-friendly language!';
    END IF;
END $$;
