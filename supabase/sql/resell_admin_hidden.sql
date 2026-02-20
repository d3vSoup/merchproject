-- Add admin_hidden column to resell_items for admin moderation (hide NSFW/inappropriate content)
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TABLE resell_items ADD COLUMN admin_hidden BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
