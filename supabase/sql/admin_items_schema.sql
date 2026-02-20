-- Admin Items Schema for Sold-Out Management
-- Run this in your Supabase SQL Editor

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS admin_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tab_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant TEXT,
  sold_out BOOLEAN DEFAULT FALSE,
  event_status TEXT DEFAULT 'ongoing', -- ongoing, soldout, over, no_new_releases
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tab_key, product_id, variant)
);

DO $$
BEGIN
  ALTER TABLE admin_items ADD COLUMN club_or_dept TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE admin_items DROP CONSTRAINT admin_items_tab_key_product_id_variant_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE admin_items ADD CONSTRAINT admin_items_unique_idx UNIQUE (tab_key, product_id, variant, club_or_dept);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_items_tab_product ON admin_items(tab_key, product_id);
CREATE INDEX IF NOT EXISTS idx_admin_items_sold_out ON admin_items(sold_out) WHERE sold_out = TRUE;

DO $$
BEGIN
  CREATE TRIGGER update_admin_items_updated_at
  BEFORE UPDATE ON admin_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS product_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tab_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT,
  price NUMERIC,
  image_url TEXT,
  description TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tab_key, product_id)
);

DO $$
BEGIN
  ALTER TABLE product_overrides ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_product_overrides_updated_at
  BEFORE UPDATE ON product_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
