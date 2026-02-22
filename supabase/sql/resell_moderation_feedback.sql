-- Resell Moderation and Feedback
-- Run in Supabase SQL Editor

-- 1. Moderation: new listings require approval before going live
DO $$
BEGIN
  ALTER TABLE resell_items ADD COLUMN moderation_status TEXT DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Backfill: existing active items are approved
UPDATE resell_items SET moderation_status = 'approved' WHERE moderation_status IS NULL;

-- Default new items to pending
ALTER TABLE resell_items ALTER COLUMN moderation_status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_resell_items_moderation ON resell_items(moderation_status);

-- 2. Feedback from interested buyers (persisted, doesn't go away)
-- item_id uses BIGINT to match resell_items.id (Supabase may create id as bigint)
CREATE TABLE IF NOT EXISTS resell_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id BIGINT NOT NULL REFERENCES resell_items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_usn TEXT NOT NULL,
  buyer_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resell_feedback_item ON resell_feedback(item_id);
CREATE INDEX IF NOT EXISTS idx_resell_feedback_seller ON resell_feedback(seller_id);
CREATE INDEX IF NOT EXISTS idx_resell_feedback_created ON resell_feedback(created_at);
