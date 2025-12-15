-- Add countdown_date column to admin_items table
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TABLE admin_items ADD COLUMN countdown_date TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create index for faster queries on countdown events
CREATE INDEX IF NOT EXISTS idx_admin_items_countdown ON admin_items(tab_key, event_status, countdown_date) 
WHERE event_status = 'countdown';

