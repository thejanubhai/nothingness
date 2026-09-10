-- Migration: Event RSVPs and Audio Upload Tracking

CREATE TABLE IF NOT EXISTS kinkster_event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES kinkster_events(id) ON DELETE CASCADE,
    kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    status VARCHAR(16) CHECK (status IN ('requested', 'confirmed', 'declined')) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, kinkster_id)
);

ALTER TABLE kinkster_event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read for rsvps" ON kinkster_event_rsvps;
CREATE POLICY "Allow authenticated read for rsvps" ON kinkster_event_rsvps FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow user manage own rsvps" ON kinkster_event_rsvps;
CREATE POLICY "Allow user manage own rsvps" ON kinkster_event_rsvps FOR ALL TO authenticated USING (
    auth.uid() = kinkster_id
);
