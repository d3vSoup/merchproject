-- Users Table Fix - Add missing profile columns
-- Run this in your Supabase SQL Editor

-- Add updated_at column (required by triggers)
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add usn column
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN usn TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add phone column
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN phone TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add name column (might already exist)
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN name TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add branch column
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN branch TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add sem column (semester/year of passing)
DO $$
BEGIN
  ALTER TABLE users ADD COLUMN sem TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Drop problematic trigger if it exists (optional - safer approach)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

