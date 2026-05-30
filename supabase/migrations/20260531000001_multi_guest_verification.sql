CREATE TABLE IF NOT EXISTS public.booking_guests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_index integer NOT NULL, 
  name text,
  verification_status text DEFAULT 'pending', 
  verification_token uuid DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for booking_guests" ON public.booking_guests
  FOR ALL
  USING (true)
  WITH CHECK (true);
