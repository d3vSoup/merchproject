-- Add hidden column to product_overrides for soft-delete / hide listings
-- REQUIRED: Run this in your Supabase SQL Editor for admin delete/hide to work.
-- Without this, deleted items will still appear in catalog, cart, and wishlist.

DO $$
BEGIN
  ALTER TABLE product_overrides ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
