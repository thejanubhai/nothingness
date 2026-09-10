-- Migration: AI Sexual Health Verification & Non-Discriminatory Profile Badges

-- 1. Create kinkster_health_reports table
CREATE TABLE IF NOT EXISTS kinkster_health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kinkster_id UUID NOT NULL REFERENCES kinkster_profiles(id) ON DELETE CASCADE,
    report_image_url TEXT NOT NULL,
    hiv_status VARCHAR(32) CHECK (hiv_status IN ('negative', 'positive_undetectable', 'positive')) DEFAULT 'negative',
    sti_status VARCHAR(32) CHECK (sti_status IN ('clear', 'active_treatment', 'reactive')) DEFAULT 'clear',
    test_date DATE,
    raw_ai_analysis JSONB,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add health_badges column to kinkster_profiles if not exists
ALTER TABLE kinkster_profiles ADD COLUMN IF NOT EXISTS health_badges JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kinkster_health_kinkster ON kinkster_health_reports(kinkster_id);

-- Enable RLS
ALTER TABLE kinkster_health_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read for health reports" ON kinkster_health_reports;
CREATE POLICY "Allow authenticated read for health reports" ON kinkster_health_reports FOR SELECT TO authenticated USING (
    auth.uid() = kinkster_id
);
DROP POLICY IF EXISTS "Allow user insert own health report" ON kinkster_health_reports;
CREATE POLICY "Allow user insert own health report" ON kinkster_health_reports FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = kinkster_id
);
