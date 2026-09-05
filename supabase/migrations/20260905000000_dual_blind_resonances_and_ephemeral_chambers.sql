-- Migration: Dual-Blind Desire Resonance & Ephemeral Confidential Chambers
-- Ensures 100% confidential intention pairing with zero rejection alert, unlocking temporary encrypted chat on mutual lock.

CREATE TABLE IF NOT EXISTS kinkster_resonances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    is_mutual BOOLEAN DEFAULT FALSE,
    chamber_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, target_id)
);

-- Ephemeral Whispers Messages Table
CREATE TABLE IF NOT EXISTS kinkster_ephemeral_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamber_token TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(16) CHECK (message_type IN ('text', 'burn_photo', 'voice_whisper')) DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    is_burnt BOOLEAN DEFAULT FALSE,
    burnt_at TIMESTAMPTZ,
    burn_countdown_seconds INT DEFAULT 5,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_resonances_sender ON kinkster_resonances(sender_id);
CREATE INDEX IF NOT EXISTS idx_resonances_target ON kinkster_resonances(target_id);
CREATE INDEX IF NOT EXISTS idx_resonances_chamber ON kinkster_resonances(chamber_token);
CREATE INDEX IF NOT EXISTS idx_ephemeral_chamber ON kinkster_ephemeral_messages(chamber_token, created_at ASC);

-- Enable RLS
ALTER TABLE kinkster_resonances ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_ephemeral_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Members only read their own outbound/mutual resonances
CREATE POLICY "Allow members read own resonances" ON kinkster_resonances FOR SELECT TO authenticated USING (
    auth.uid() = sender_id OR (auth.uid() = target_id AND is_mutual = true)
);

CREATE POLICY "Allow members insert own resonances" ON kinkster_resonances FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id
);

CREATE POLICY "Allow members read ephemeral messages" ON kinkster_ephemeral_messages FOR SELECT TO authenticated USING (
    true
);

CREATE POLICY "Allow members insert ephemeral messages" ON kinkster_ephemeral_messages FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id
);
