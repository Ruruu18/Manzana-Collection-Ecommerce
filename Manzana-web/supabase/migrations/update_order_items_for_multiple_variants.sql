-- Migration: Update order_items to support multiple variants
-- This allows orders to store multiple variant selections (e.g., Color + Size)

-- Step 1: Add the new variant_ids column as JSONB array
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_ids JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing data from product_variant_id to variant_ids
-- Convert single variant ID to array format
UPDATE order_items
SET variant_ids = jsonb_build_array(product_variant_id::text)
WHERE product_variant_id IS NOT NULL AND variant_ids = '[]'::jsonb;

-- Step 3: Drop the old product_variant_id column
ALTER TABLE order_items
DROP COLUMN IF EXISTS product_variant_id;

-- Step 4: Create index for better query performance on variant_ids
CREATE INDEX IF NOT EXISTS idx_order_items_variant_ids
ON order_items USING GIN (variant_ids);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN order_items.variant_ids IS 'Array of product variant IDs (e.g., ["uuid1", "uuid2"] for Color + Size)';
