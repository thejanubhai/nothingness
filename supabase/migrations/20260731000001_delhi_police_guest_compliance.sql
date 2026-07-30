-- Add Delhi Police & Hotel/BnB Check-in Law Compliance fields to guest_profiles
ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS is_foreign_national BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visa_number TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS police_register_status TEXT DEFAULT 'verified_compliant',
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add index for police register queries
CREATE INDEX IF NOT EXISTS idx_guest_profiles_police_status ON public.guest_profiles(police_register_status);
