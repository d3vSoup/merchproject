-- Add club_or_dept column to cart table for club-specific items
-- Run this in your Supabase SQL Editor

-- Add club_or_dept column
DO $$
BEGIN
  ALTER TABLE cart ADD COLUMN club_or_dept TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Drop old unique constraint if exists
DO $$
BEGIN
  ALTER TABLE cart DROP CONSTRAINT IF EXISTS cart_user_id_tab_key_product_id_variant_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new unique constraint including club_or_dept
DO $$
BEGIN
  ALTER TABLE cart ADD CONSTRAINT cart_unique_item 
    UNIQUE (user_id, tab_key, product_id, variant, club_or_dept);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cart_club ON cart(tab_key, club_or_dept) WHERE club_or_dept IS NOT NULL;

