-- Migration: Flagship Kinkster Expansion (Joint Bookings, Audio Clips, Admin-Gated Events & Discretion Ratings)

-- 1. Add audio_vibe_url and is_trusted_host to kinkster_profiles
ALTER TABLE kinkster_profiles ADD COLUMN IF NOT EXISTS audio_vibe_url TEXT;
ALTER TABLE kinkster_profiles ADD COLUMN IF NOT EXISTS is_trusted_host BOOLEAN DEFAULT FALSE;

-- 2. Create kinkster_events table
CREATE TABLE IF NOT EXISTS kinkster_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location_name VARCHAR(128) DEFAULT 'Discreet Location (Revealed on RSVP)',
    max_capacity INT DEFAULT 12,
    is_admin_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create kinkster_ratings table
CREATE TABLE IF NOT EXISTS kinkster_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    discretion_score INT CHECK (discretion_score BETWEEN 1 AND 5) DEFAULT 5,
    respect_score INT CHECK (respect_score BETWEEN 1 AND 5) DEFAULT 5,
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5) DEFAULT 5,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rater_id, target_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kinkster_events_host ON kinkster_events(host_kinkster_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_ratings_target ON kinkster_ratings(target_id);

-- Enable RLS
ALTER TABLE kinkster_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read for events" ON kinkster_events;
CREATE POLICY "Allow authenticated read for events" ON kinkster_events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow trusted host create events" ON kinkster_events;
CREATE POLICY "Allow trusted host create events" ON kinkster_events FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = host_kinkster_id
);

DROP POLICY IF EXISTS "Allow authenticated read for ratings" ON kinkster_ratings;
CREATE POLICY "Allow authenticated read for ratings" ON kinkster_ratings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow user manage own ratings" ON kinkster_ratings;
CREATE POLICY "Allow user manage own ratings" ON kinkster_ratings FOR ALL TO authenticated USING (
    auth.uid() = rater_id
);
