-- Migration: Kinkster Mandatory Stay Verification, Multi-Screenshot AI Parsing & Pre-stored Shadow Co-Guests

-- 1. Enhance kinkster_profiles with stay verification fields
ALTER TABLE public.kinkster_profiles
ADD COLUMN IF NOT EXISTS stay_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stay_verification_source VARCHAR(32), -- 'existing_booking', 'screenshot_ai', 'admin_override'
ADD COLUMN IF NOT EXISTS stay_verification_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS stay_verified_at TIMESTAMPTZ;

-- 2. Enhance guest_profiles for pre-stored shadow co-guest matching
ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS is_prestored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prestored_from_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS prestored_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Enhance bookings for multi-screenshot AI reservation proof storage
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS proof_screenshots TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extracted_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_screenshot_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'direct';

-- 4. Indexes for fast identity resolution and stay verification checks
CREATE INDEX IF NOT EXISTS idx_kinkster_profiles_stay_verified ON public.kinkster_profiles(stay_verified);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_prestored ON public.guest_profiles(is_prestored);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_doc_number ON public.guest_profiles(document_number);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
