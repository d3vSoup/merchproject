-- Add delivery columns to confirmed_orders table
-- Run this in the Supabase SQL Editor

ALTER TABLE confirmed_orders 
  ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_maps_link TEXT;
