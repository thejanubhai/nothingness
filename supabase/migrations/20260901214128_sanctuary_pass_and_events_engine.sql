-- Migration: Sanctuary Pass, Events Engine & WebPush Subscriptions

-- 1. Create sanctuary_pass_settings table
CREATE TABLE IF NOT EXISTS sanctuary_pass_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    one_time_pass_price INT DEFAULT 1499,
    ai_vetting_enabled BOOLEAN DEFAULT TRUE,
    default_ratio_couples INT DEFAULT 60,
    default_ratio_females INT DEFAULT 25,
    default_ratio_males INT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial settings if empty
INSERT INTO sanctuary_pass_settings (one_time_pass_price, ai_vetting_enabled, default_ratio_couples, default_ratio_females, default_ratio_males)
SELECT 1499, true, 60, 25, 15
WHERE NOT EXISTS (SELECT 1 FROM sanctuary_pass_settings);

-- 2. Create sanctuary_passes table (One-Time Portal Access)
CREATE TABLE IF NOT EXISTS sanctuary_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'active',
    amount_paid INT DEFAULT 1499,
    order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Create sanctuary_events table
CREATE TABLE IF NOT EXISTS sanctuary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(256) NOT NULL,
    tagline VARCHAR(256),
    description TEXT NOT NULL,
    tier VARCHAR(32) CHECK (tier IN ('munch', 'rave', 'soiree')) DEFAULT 'soiree',
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    venue_notes TEXT DEFAULT 'Exclusive Nothingness Sanctuary Penthouse/Lounge',
    event_date TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    dress_code TEXT DEFAULT 'Noir Luxury / Velvet & Leather / Masquerade',
    consent_marshall_name VARCHAR(128) DEFAULT 'Aria (Floor Lead)',
    price_couples INT DEFAULT 3999,
    price_females INT DEFAULT 1499,
    price_males INT DEFAULT 4999,
    price_nonbinary INT DEFAULT 1999,
    max_couples INT DEFAULT 6,
    max_females INT DEFAULT 4,
    max_males INT DEFAULT 3,
    max_nonbinary INT DEFAULT 2,
    secret_location_address TEXT DEFAULT 'Revealed 3 hours before start time',
    secret_location_coordinates TEXT DEFAULT '28.5244,77.2066',
    secret_location_instructions TEXT DEFAULT 'Discreet private elevator access. Whisper alias at door.',
    location_revealed_hours_before INT DEFAULT 3,
    status VARCHAR(32) CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create sanctuary_event_applications table
CREATE TABLE IF NOT EXISTS sanctuary_event_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES sanctuary_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(32) CHECK (category IN ('couple', 'single_female', 'single_male', 'non_binary')) DEFAULT 'couple',
    ai_generated_questions JSONB DEFAULT '[]'::JSONB,
    ai_applicant_answers JSONB DEFAULT '[]'::JSONB,
    ai_trust_score INT CHECK (ai_trust_score BETWEEN 0 AND 100) DEFAULT 75,
    ai_evaluation_summary TEXT,
    status VARCHAR(32) CHECK (status IN ('applied', 'waitlisted', 'approved_payment_pending', 'confirmed', 'rejected', 'dropped_out', 'checked_in')) DEFAULT 'applied',
    payment_order_id TEXT,
    ticket_price_paid INT DEFAULT 0,
    payment_deadline TIMESTAMPTZ,
    qr_secret_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    checked_in_at TIMESTAMPTZ,
    checked_in_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 5. Create web_push_subscriptions table
CREATE TABLE IF NOT EXISTS web_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- 6. Indexes for ultra-fast queries
CREATE INDEX IF NOT EXISTS idx_sanctuary_events_date ON sanctuary_events(event_date);
CREATE INDEX IF NOT EXISTS idx_sanctuary_events_status ON sanctuary_events(status);
CREATE INDEX IF NOT EXISTS idx_sanctuary_apps_event_status ON sanctuary_event_applications(event_id, status);
CREATE INDEX IF NOT EXISTS idx_sanctuary_apps_user ON sanctuary_event_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_web_push_user ON web_push_subscriptions(user_id);

-- 7. Enable RLS
ALTER TABLE sanctuary_pass_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctuary_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctuary_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctuary_event_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "Public read for settings" ON sanctuary_pass_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON sanctuary_pass_settings FOR ALL USING (true);

CREATE POLICY "User read own pass" ON sanctuary_passes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manage passes" ON sanctuary_passes FOR ALL USING (true);

CREATE POLICY "Public read published events" ON sanctuary_events FOR SELECT USING (status != 'draft');
CREATE POLICY "Admin manage events" ON sanctuary_events FOR ALL USING (true);

CREATE POLICY "User read own applications" ON sanctuary_event_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User create own application" ON sanctuary_event_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own application" ON sanctuary_event_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manage all applications" ON sanctuary_event_applications FOR ALL USING (true);

CREATE POLICY "User manage own push subscriptions" ON web_push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin read all push subscriptions" ON web_push_subscriptions FOR SELECT USING (true);
