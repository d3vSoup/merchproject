-- Wishlist Table Schema
-- Run this in your Supabase SQL Editor

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tab_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tab_key, product_id, variant)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(tab_key, product_id);

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies (if using RLS - backend uses service role so these are optional)
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own wishlist" ON wishlist;
CREATE POLICY "Users can insert into their own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their own wishlist" ON wishlist;
CREATE POLICY "Users can delete from their own wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

