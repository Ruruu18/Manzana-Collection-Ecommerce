-- ================================
-- ORDER STATUS NOTIFICATION SYSTEM
-- ================================
-- This creates automatic notifications when order status changes
-- Notifications are sent to customers for status updates

-- Function to create notification when order status changes
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
                    TO_CHAR(NEW.pickup_date::timestamp, 'Mon DD, YYYY') || ' at ' || NEW.pickup_time || '.';

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

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_order_status_change();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_order_status_change() TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status_updated
    ON orders(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_order_data
    ON notifications USING gin (data);

COMMENT ON FUNCTION notify_order_status_change() IS
    'Automatically creates notifications when order status changes. Triggered on any status update.';

COMMENT ON TRIGGER order_status_notification_trigger ON orders IS
    'Sends notification to customer when their order status changes';

-- Test the trigger (optional - comment out if not needed)
-- UPDATE orders SET status = 'confirmed' WHERE id = 'some-order-id';
