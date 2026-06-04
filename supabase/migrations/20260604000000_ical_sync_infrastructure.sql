-- Calendar Sync Infrastructure
-- Supports two-way iCal sync between Nothingness and booking aggregators

-- Calendar sync sources for each space (inbound feeds from external platforms)
CREATE TABLE IF NOT EXISTS calendar_sync_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,             -- 'airbnb', 'booking_com', 'vrbo', 'google_calendar', 'custom'
  inbound_ical_url TEXT NOT NULL,     -- URL we fetch FROM the aggregator
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'synced', 'error', 'pending'
  sync_error TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External blocked dates parsed from inbound iCal feeds
CREATE TABLE IF NOT EXISTS external_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES calendar_sync_sources(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary TEXT,
  external_uid TEXT,                  -- UID from the iCal event for deduplication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, external_uid)
);

-- Add Airbnb listing metadata to spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS airbnb_listing_id TEXT;
-- airbnb_ical_url already exists from migration 00002

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_sources_space_id ON calendar_sync_sources(space_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_sources_active ON calendar_sync_sources(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_external_blocked_dates_space_id ON external_blocked_dates(space_id);
CREATE INDEX IF NOT EXISTS idx_external_blocked_dates_dates ON external_blocked_dates(start_date, end_date);

-- Enable RLS
ALTER TABLE calendar_sync_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Allow admins to manage calendar sync sources" ON calendar_sync_sources
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR auth.jwt() ->> 'email' LIKE '%admin%'
    OR auth.jwt() ->> 'email' LIKE '%hudav%'
  );

CREATE POLICY "Allow admins to manage external blocked dates" ON external_blocked_dates
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR auth.jwt() ->> 'email' LIKE '%admin%'
    OR auth.jwt() ->> 'email' LIKE '%hudav%'
  );

-- Public read access for blocked dates (needed for booking availability checks)
CREATE POLICY "Anyone can view external blocked dates" ON external_blocked_dates
  FOR SELECT USING (true);
