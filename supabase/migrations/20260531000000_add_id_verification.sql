ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS id_verification_status text DEFAULT 'pending';

-- Set existing bookings to verified if we want to ignore them, or leave as pending
UPDATE public.bookings SET id_verification_status = 'pending' WHERE id_verification_status IS NULL;
