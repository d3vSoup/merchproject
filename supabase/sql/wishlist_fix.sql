-- Wishlist Table Fix - Add missing variant column
-- Run this in your Supabase SQL Editor if you get "column wishlist.variant does not exist" error

-- Add variant column to wishlist table if it doesn't exist
DO $$
BEGIN
  ALTER TABLE wishlist ADD COLUMN variant TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Drop old unique constraints if they exist (different naming conventions)
DO $$
BEGIN
  ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_tab_key_product_id_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_tab_key_product_id_variant_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add the new unique constraint including variant
DO $$
BEGIN
  ALTER TABLE wishlist ADD CONSTRAINT wishlist_unique_item 
    UNIQUE (user_id, tab_key, product_id, variant);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wishlist';

