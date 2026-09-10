-- Migration: Gathering Vettings Audit Trail, Profile Aliases & Dual-Blind Persistence
-- Bridges R1, R3, and R4 database requirements for Nothingness Kinkster Mode

-- 1. Create gathering_vettings table (Audit log for Consent Marshall physical certifications)
CREATE TABLE IF NOT EXISTS public.gathering_vettings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.sanctuary_events(id) ON DELETE SET NULL,
    attendee_id UUID NOT NULL,
    marshall_id TEXT NOT NULL,
    marshall_alias TEXT DEFAULT 'Consent Marshall',
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verification_method TEXT DEFAULT 'qr_scan',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gathering_vettings_attendee ON public.gathering_vettings(attendee_id);
CREATE INDEX IF NOT EXISTS idx_gathering_vettings_event ON public.gathering_vettings(event_id);
CREATE INDEX IF NOT EXISTS idx_gathering_vettings_verified_at ON public.gathering_vettings(verified_at DESC);

ALTER TABLE public.gathering_vettings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gathering_vettings' AND policyname = 'Admins and Marshalls manage vettings') THEN
        DROP POLICY IF EXISTS "Admins and Marshalls manage vettings" ON public.gathering_vettings;
        CREATE POLICY "Admins and Marshalls manage vettings" ON public.gathering_vettings
            FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gathering_vettings' AND policyname = 'Attendees view own vetting records') THEN
        DROP POLICY IF EXISTS "Attendees view own vetting records" ON public.gathering_vettings;
        CREATE POLICY "Attendees view own vetting records" ON public.gathering_vettings
            FOR SELECT TO authenticated USING (auth.uid() = attendee_id);
    END IF;
END $$;

-- 2. Add is_in_person_vetted column to kinkster_profiles and guest_profiles (satisfies spec contract)
ALTER TABLE public.kinkster_profiles 
    ADD COLUMN IF NOT EXISTS is_in_person_vetted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.guest_profiles 
    ADD COLUMN IF NOT EXISTS is_in_person_vetted BOOLEAN DEFAULT FALSE;

-- Sync existing in_person_vetted values
UPDATE public.kinkster_profiles 
SET is_in_person_vetted = in_person_vetted 
WHERE is_in_person_vetted IS NULL OR is_in_person_vetted = FALSE;

UPDATE public.guest_profiles 
SET is_in_person_vetted = in_person_vetted 
WHERE is_in_person_vetted IS NULL OR is_in_person_vetted = FALSE;

-- Ensure public access for kinkster_profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_profiles' AND policyname = 'Public read for kinkster_profiles') THEN
        DROP POLICY IF EXISTS "Public read for kinkster_profiles" ON public.kinkster_profiles;
        CREATE POLICY "Public read for kinkster_profiles" ON public.kinkster_profiles 
            FOR SELECT TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_profiles' AND policyname = 'Public update for kinkster_profiles') THEN
        DROP POLICY IF EXISTS "Public update for kinkster_profiles" ON public.kinkster_profiles;
        CREATE POLICY "Public update for kinkster_profiles" ON public.kinkster_profiles 
            FOR UPDATE TO public USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. Ensure kinkster_resonances exists with 48-hour expiration
CREATE TABLE IF NOT EXISTS public.kinkster_resonances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    is_mutual BOOLEAN DEFAULT FALSE,
    chamber_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_resonances_sender ON public.kinkster_resonances(sender_id);
CREATE INDEX IF NOT EXISTS idx_resonances_target ON public.kinkster_resonances(target_id);
CREATE INDEX IF NOT EXISTS idx_resonances_chamber ON public.kinkster_resonances(chamber_token);
CREATE INDEX IF NOT EXISTS idx_resonances_expires ON public.kinkster_resonances(expires_at);

ALTER TABLE public.kinkster_resonances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_resonances' AND policyname = 'Allow members read own resonances') THEN
        DROP POLICY IF EXISTS "Allow members read own resonances" ON public.kinkster_resonances;
        CREATE POLICY "Allow members read own resonances" ON public.kinkster_resonances 
            FOR SELECT TO authenticated USING (
                auth.uid() = sender_id OR (auth.uid() = target_id AND is_mutual = true)
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_resonances' AND policyname = 'Allow members insert own resonances') THEN
        DROP POLICY IF EXISTS "Allow members insert own resonances" ON public.kinkster_resonances;
        CREATE POLICY "Allow members insert own resonances" ON public.kinkster_resonances 
            FOR INSERT TO authenticated WITH CHECK (
                auth.uid() = sender_id
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_resonances' AND policyname = 'Allow members update own resonances') THEN
        DROP POLICY IF EXISTS "Allow members update own resonances" ON public.kinkster_resonances;
        CREATE POLICY "Allow members update own resonances" ON public.kinkster_resonances 
            FOR UPDATE TO authenticated USING (
                auth.uid() = sender_id OR auth.uid() = target_id
            );
    END IF;
END $$;

-- 4. Ensure kinkster_ephemeral_messages exists with 24-hour expiration
CREATE TABLE IF NOT EXISTS public.kinkster_ephemeral_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamber_token TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.kinkster_profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(16) CHECK (message_type IN ('text', 'burn_photo', 'voice_whisper')) DEFAULT 'text',
    content TEXT NOT NULL,
    media_url TEXT,
    is_burnt BOOLEAN DEFAULT FALSE,
    burnt_at TIMESTAMPTZ,
    burn_countdown_seconds INT DEFAULT 5,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ephemeral_chamber ON public.kinkster_ephemeral_messages(chamber_token, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ephemeral_expires ON public.kinkster_ephemeral_messages(expires_at);

ALTER TABLE public.kinkster_ephemeral_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_ephemeral_messages' AND policyname = 'Allow members read ephemeral messages') THEN
        DROP POLICY IF EXISTS "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages;
        CREATE POLICY "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages 
            FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_ephemeral_messages' AND policyname = 'Allow members insert ephemeral messages') THEN
        DROP POLICY IF EXISTS "Allow members insert ephemeral messages" ON public.kinkster_ephemeral_messages;
        CREATE POLICY "Allow members insert ephemeral messages" ON public.kinkster_ephemeral_messages 
            FOR INSERT TO authenticated WITH CHECK (
                auth.uid() = sender_id
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kinkster_ephemeral_messages' AND policyname = 'Allow members update ephemeral messages') THEN
        DROP POLICY IF EXISTS "Allow members update ephemeral messages" ON public.kinkster_ephemeral_messages;
        CREATE POLICY "Allow members update ephemeral messages" ON public.kinkster_ephemeral_messages 
            FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

-- 5. RPC Function: Automated 24-Hour Ephemeral Message Shredder
CREATE OR REPLACE FUNCTION public.purge_expired_ephemeral_messages()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.kinkster_ephemeral_messages
    WHERE created_at < (NOW() - INTERVAL '24 hours')
       OR (expires_at IS NOT NULL AND expires_at < NOW());
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
