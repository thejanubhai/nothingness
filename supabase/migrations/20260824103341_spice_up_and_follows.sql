-- Migration: Kinkster Follows & Mutual Spice Up Connection Algorithm

-- 1. Create kinkster_follows table
CREATE TABLE IF NOT EXISTS kinkster_follows (
    follower_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 2. Create kinkster_spice_requests table
CREATE TABLE IF NOT EXISTS kinkster_spice_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    status VARCHAR(16) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kinkster_follows_follower ON kinkster_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_follows_following ON kinkster_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_spice_receiver ON kinkster_spice_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_kinkster_spice_pair ON kinkster_spice_requests(sender_id, receiver_id);

-- Enable RLS
ALTER TABLE kinkster_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_spice_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read for follows" ON kinkster_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user manage own follows" ON kinkster_follows FOR ALL TO authenticated USING (
    auth.uid() = follower_id
);

CREATE POLICY "Allow users read own spice requests" ON kinkster_spice_requests FOR SELECT TO authenticated USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Allow users manage own spice requests" ON kinkster_spice_requests FOR ALL TO authenticated USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
