CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone_number text UNIQUE, -- Nullable, but unique if provided
  id_document_type text, -- Aadhaar, Passport
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for guest_profiles" ON public.guest_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add guest_profile_id to booking_guests
ALTER TABLE public.booking_guests
ADD COLUMN guest_profile_id uuid REFERENCES public.guest_profiles(id) ON DELETE SET NULL;
