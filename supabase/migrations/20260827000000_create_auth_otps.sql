-- Migration: Create auth_otps table for server-side OTP authentication
CREATE TABLE IF NOT EXISTS public.auth_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookups and active OTPs
CREATE INDEX IF NOT EXISTS idx_auth_otps_phone ON public.auth_otps(phone);
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON public.auth_otps(expires_at);

-- Enable RLS
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access" ON public.auth_otps;
DROP POLICY IF EXISTS "Allow service role full access on auth_otps" ON public.auth_otps;
CREATE POLICY "Allow service role full access on auth_otps"
    ON public.auth_otps
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
