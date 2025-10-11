-- ================================
-- FIX PICKUP ORDER STATUS VALUES
-- ================================
-- This updates the orders table to support proper pickup order statuses
-- Changes 'shipped' to 'ready' and 'delivered' to 'completed' for pickup orders

-- Step 1: Drop the old status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add new status constraint with pickup-friendly values
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
        'pending',      -- Order placed, awaiting confirmation
        'confirmed',    -- Order confirmed by staff
        'processing',   -- Order being prepared
        'ready',        -- Ready for pickup (was 'shipped')
        'completed',    -- Picked up / delivered (was 'delivered')
        'cancelled'     -- Order cancelled
    ));

-- Step 3: Migrate existing data (if any orders have old status values)
-- Change 'shipped' to 'ready'
UPDATE orders SET status = 'ready' WHERE status = 'shipped';

-- Change 'delivered' to 'completed'
UPDATE orders SET status = 'completed' WHERE status = 'delivered';

-- Step 4: Update the notification trigger function
DROP FUNCTION IF EXISTS notify_order_status_change() CASCADE;

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT := 'order_update';
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN

        -- Determine notification content based on new status
        CASE NEW.status
            WHEN 'confirmed' THEN
                notification_title := '✅ Order Confirmed!';
                notification_message := 'Your order ' || NEW.order_number || ' has been confirmed. We are preparing your items.';

            WHEN 'processing' THEN
                notification_title := '📦 Order Processing';
                notification_message := 'Your order ' || NEW.order_number || ' is being processed and prepared.';

            WHEN 'ready' THEN
                notification_title := '🎉 Order Ready for Pickup!';
                notification_message := 'Your order ' || NEW.order_number || ' is ready! Please pick it up at your scheduled time: ' ||
                    COALESCE(TO_CHAR(NEW.pickup_date::timestamp, 'Mon DD, YYYY'), 'your scheduled date') ||
                    COALESCE(' at ' || NEW.pickup_time, '') || '.';

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
        RAISE NOTICE 'Order status notification created for order % (% -> %)',
            NEW.order_number, OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_order_status_change();

-- Step 6: Add pickup-specific columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_pickup VARCHAR(50);

-- Step 7: Create index for pickup orders
CREATE INDEX IF NOT EXISTS idx_orders_status_pickup
    ON orders(status, pickup_date)
    WHERE pickup_date IS NOT NULL;

-- Step 8: Add comment for clarity
COMMENT ON COLUMN orders.status IS
    'Order status: pending (new), confirmed (accepted), processing (being prepared), ready (ready for pickup), completed (picked up), cancelled';

COMMENT ON TRIGGER order_status_notification_trigger ON orders IS
    'Sends notification to customer when order status changes. Now uses pickup-friendly status names.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Pickup order statuses updated successfully!';
    RAISE NOTICE '   Status values now: pending → confirmed → processing → ready → completed';
    RAISE NOTICE '   Old "shipped" renamed to "ready"';
    RAISE NOTICE '   Old "delivered" renamed to "completed"';
END $$;
