-- Resell Items Expiration and Deletion Support
-- Run this in your Supabase SQL Editor

-- Add expires_at column (auto-expires after 30 days from creation)
DO $$
BEGIN
  ALTER TABLE resell_items ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add deleted_at column (soft delete for manual deletion)
DO $$
BEGIN
  ALTER TABLE resell_items ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Set expires_at for existing items (30 days from created_at)
UPDATE resell_items
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Create index for faster queries on active items
-- Note: Cannot use NOW() in index predicate as it's not immutable
-- Instead, create a simpler index and filter expired items in application code
CREATE INDEX IF NOT EXISTS idx_resell_items_active 
ON resell_items(user_id, status, deleted_at, expires_at) 
WHERE deleted_at IS NULL;

-- Function to automatically set expires_at on insert
CREATE OR REPLACE FUNCTION set_resell_item_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expires_at
DROP TRIGGER IF EXISTS trigger_set_resell_expires_at ON resell_items;
CREATE TRIGGER trigger_set_resell_expires_at
BEFORE INSERT ON resell_items
FOR EACH ROW
EXECUTE FUNCTION set_resell_item_expires_at();

