-- Migration: Kinkster Post Reports & Safety Moderation
-- Enables members to report non-consensual media, privacy leaks, or guideline breaches.

CREATE TABLE IF NOT EXISTS kinkster_post_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reporter_alias VARCHAR(64),
    reason VARCHAR(128) NOT NULL,
    details TEXT,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kinkster_reports_post_id ON kinkster_post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_reports_reporter_id ON kinkster_post_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_kinkster_reports_status ON kinkster_post_reports(status);

-- Enable RLS
ALTER TABLE kinkster_post_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to report posts
DROP POLICY IF EXISTS "Allow authenticated insert report" ON kinkster_post_reports;
CREATE POLICY "Allow authenticated insert report" ON kinkster_post_reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Allow users to view their own reports
DROP POLICY IF EXISTS "Allow users to view own reports" ON kinkster_post_reports;
CREATE POLICY "Allow users to view own reports" ON kinkster_post_reports
    FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Allow service role full access for administration
DROP POLICY IF EXISTS "Allow service role full access" ON kinkster_post_reports;
CREATE POLICY "Allow service role full access" ON kinkster_post_reports
    FOR ALL TO service_role USING (true);
