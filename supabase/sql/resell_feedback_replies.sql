-- Add reply/comment chain support to resell_feedback
-- Run in Supabase SQL Editor

-- Add parent_id for threaded replies (null = top-level feedback)
DO $$
BEGIN
  ALTER TABLE resell_feedback ADD COLUMN parent_id UUID REFERENCES resell_feedback(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_resell_feedback_parent ON resell_feedback(parent_id);
