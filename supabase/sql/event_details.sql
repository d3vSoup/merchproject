-- Event details table for date, time, location, and Google Maps link
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS event_details (
  tab_key TEXT PRIMARY KEY,
  event_date TEXT,
  event_time TEXT,
  event_location TEXT,
  event_gmaps_url TEXT,
  entry_policy TEXT,
  merch_popup TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backend uses service_role which bypasses RLS. No policies needed for server-side access.
