-- Add phone number unique constraint / index & verification_expires_at to guest_profiles
ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Add index on phone number for fast 180-day lookup
CREATE INDEX IF NOT EXISTS idx_guest_profiles_phone ON public.guest_profiles(phone);

-- Function to set verification_expires_at to 180 days from verification_timestamp
UPDATE public.guest_profiles
SET verification_expires_at = COALESCE(verification_timestamp, NOW()) + INTERVAL '180 days'
WHERE is_verified = TRUE AND verification_expires_at IS NULL;
