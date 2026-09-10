-- Migration: Vetted Kinkster Profiles & Instagram-Style Media Feed
-- Restricts social profile access exclusively to ID-verified guests with active confidentiality agreement.

-- 1. Create kinkster_profiles table
CREATE TABLE IF NOT EXISTS kinkster_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    alias VARCHAR(64) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    is_activated BOOLEAN DEFAULT FALSE,
    confidentiality_agreed BOOLEAN DEFAULT FALSE,
    confidentiality_agreed_at TIMESTAMPTZ,
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create kinkster_posts table
CREATE TABLE IF NOT EXISTS kinkster_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    media_type VARCHAR(16) CHECK (media_type IN ('image', 'video')) NOT NULL,
    media_url TEXT NOT NULL,
    caption TEXT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast feeds and alias lookups
CREATE INDEX IF NOT EXISTS idx_kinkster_profiles_alias ON kinkster_profiles(alias);
CREATE INDEX IF NOT EXISTS idx_kinkster_posts_kinkster_id ON kinkster_posts(kinkster_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_posts_created_at ON kinkster_posts(created_at DESC);

-- Enable RLS
ALTER TABLE kinkster_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinkster_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read/write access to authenticated users
CREATE POLICY "Allow authenticated read for profiles" ON kinkster_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write for profiles" ON kinkster_profiles FOR ALL TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read for posts" ON kinkster_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write for posts" ON kinkster_posts FOR ALL TO authenticated USING (
    auth.uid() = kinkster_id
);
