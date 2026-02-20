-- Add hidden column to product_overrides for soft-delete / hide listings
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TABLE product_overrides ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
