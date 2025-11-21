-- Migration: Add soft delete and enhanced stock alerts
-- Date: 2024

-- ================================
-- 1. SOFT DELETE FOR PRODUCTS
-- ================================

-- Add deleted_at column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster soft delete queries
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- Update RLS policy to exclude soft-deleted products from public view
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Admin can still see soft-deleted products
DROP POLICY IF EXISTS "Admin can view all products" ON products;
CREATE POLICY "Admin can view all products" ON products
    FOR SELECT TO authenticated
    USING (true);

-- ================================
-- 2. ENHANCED STOCK ALERT FUNCTION
-- ================================

-- Function to check low stock and create notifications for admin
CREATE OR REPLACE FUNCTION check_low_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Check if stock fell below minimum level
    IF NEW.stock_quantity <= NEW.min_stock_level AND
       (OLD.stock_quantity > OLD.min_stock_level OR OLD.stock_quantity IS NULL) THEN

        -- Note: To enable admin notifications, you need to identify admin users
        -- This is a placeholder - update based on your admin identification system
        -- Example: If you have a metadata field or separate admin table

        -- INSERT INTO notifications (user_id, title, message, type, data, created_at)
        -- SELECT
        --     u.id,
        --     'Low Stock Alert: ' || NEW.name,
        --     'Product "' || NEW.name || '" has only ' || NEW.stock_quantity || ' items left (minimum: ' || NEW.min_stock_level || ')',
        --     'stock_alert',
        --     jsonb_build_object(
        --         'product_id', NEW.id,
        --         'product_name', NEW.name,
        --         'stock_quantity', NEW.stock_quantity,
        --         'min_stock_level', NEW.min_stock_level,
        --         'sku', NEW.sku
        --     ),
        --     NOW()
        -- FROM users u
        -- WHERE -- Add condition to identify admin users;

        -- Also notify users who have set up stock alerts for this product
        INSERT INTO notifications (user_id, title, message, type, data, created_at)
        SELECT
            sa.user_id,
            'Stock Alert: ' || NEW.name,
            'Product "' || NEW.name || '" stock is running low (' || NEW.stock_quantity || ' remaining)',
            'stock_alert',
            jsonb_build_object(
                'product_id', NEW.id,
                'product_name', NEW.name,
                'stock_quantity', NEW.stock_quantity
            ),
            NOW()
        FROM stock_alerts sa
        WHERE sa.product_id = NEW.id
            AND sa.is_active = true
            AND NEW.stock_quantity <= sa.threshold_quantity;

        -- Update last_triggered_at for triggered alerts
        UPDATE stock_alerts
        SET last_triggered_at = NOW()
        WHERE product_id = NEW.id
            AND is_active = true
            AND NEW.stock_quantity <= threshold_quantity;
    END IF;

    RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for low stock alerts
DROP TRIGGER IF EXISTS check_low_stock_trigger ON products;
CREATE TRIGGER check_low_stock_trigger
    AFTER UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_alerts();

-- Also check on insert if starting with low stock
DROP TRIGGER IF EXISTS check_low_stock_insert_trigger ON products;
CREATE TRIGGER check_low_stock_insert_trigger
    AFTER INSERT ON products
    FOR EACH ROW
    WHEN (NEW.stock_quantity <= NEW.min_stock_level)
    EXECUTE FUNCTION check_low_stock_alerts();
