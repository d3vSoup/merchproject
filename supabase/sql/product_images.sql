-- Product Images Support for Admin
-- Run this in your Supabase SQL Editor

-- Add images column to product_overrides (array of image URLs)
DO $$
BEGIN
  ALTER TABLE product_overrides ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[];
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_overrides_tab_product 
ON product_overrides(tab_key, product_id);

