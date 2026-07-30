-- Migration: Advanced Kinkster Compatibility Matching, Purposeful Co-Stays & In-App Encrypted Chat
-- Sandbox member-to-member communication strictly within Nothingness App under unique @aliases.

-- 1. Create kinkster_kinks reference table
CREATE TABLE IF NOT EXISTS kinkster_kinks (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    icon_name VARCHAR(64) DEFAULT 'Sparkles'
);

-- Seed curated lifestyle & kink categories
INSERT INTO kinkster_kinks (id, name, category, description, icon_name) VALUES
('shibari', 'Shibari & Rope Aesthetics', 'Aesthetic & Art', 'Intricate Japanese rope work and sensory suspension.', 'Feather'),
('dom_sub', 'Dominance & Submission', 'Dynamics', 'Consensual power dynamics, leadership, and surrender.', 'Shield'),
('sensory', 'Sensory Deprivation & Play', 'Sensory', 'Blindfolds, temperature play, and heightened tactile experiences.', 'EyeOff'),
('roleplay', 'Roleplay & Storytelling', 'Creative', 'Immersive character roleplay and fantasy scenarios.', 'Mask'),
('aftercare', 'Mindfulness & Aftercare', 'Emotional', 'Deep emotional grounding, cuddling, and dedicated post-session care.', 'HeartHandshake'),
('jacuzzi', 'Private Jacuzzi & Bath Soaks', 'Luxury Vibe', 'Discreet hydrotherapy and candlelit champagne lounge soaks.', 'Flame')
ON CONFLICT (id) DO NOTHING;

-- 2. Create kinkster_preferences table
CREATE TABLE IF NOT EXISTS kinkster_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    kink_id VARCHAR(64) NOT NULL REFERENCES kinkster_kinks(id) ON DELETE CASCADE,
    intensity INT CHECK (intensity BETWEEN 1 AND 5) DEFAULT 3,
    UNIQUE(kinkster_id, kink_id)
);

-- 3. Create kinkster_co_stay_invites table
CREATE TABLE IF NOT EXISTS kinkster_co_stay_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    preferred_dates_description VARCHAR(128),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create kinkster_direct_messages table (In-App Sandboxed Encrypted Messaging)
CREATE TABLE IF NOT EXISTS kinkster_direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    media_url TEXT,
    is_view_once BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ultra-fast matching & chat queries
CREATE INDEX IF NOT EXISTS idx_kinkster_prefs_kinkster ON kinkster_preferences(kinkster_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_co_stay_active ON kinkster_co_stay_invites(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kinkster_messages_thread ON kinkster_direct_messages(sender_id, receiver_id, created_at ASC);

-- Enable RLS
ALTER TABLE kinkster_kinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_co_stay_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read for kinks reference" ON kinkster_kinks FOR SELECT USING (true);

CREATE POLICY "Allow authenticated read for prefs" ON kinkster_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user manage own prefs" ON kinkster_preferences FOR ALL TO authenticated USING (
    auth.uid() = kinkster_id
);

CREATE POLICY "Allow authenticated read for co-stays" ON kinkster_co_stay_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow host manage own co-stays" ON kinkster_co_stay_invites FOR ALL TO authenticated USING (
    auth.uid() = host_kinkster_id
);

CREATE POLICY "Allow users read own message threads" ON kinkster_direct_messages FOR SELECT TO authenticated USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Allow users send messages" ON kinkster_direct_messages FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id
);
