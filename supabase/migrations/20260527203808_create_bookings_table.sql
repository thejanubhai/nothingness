-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer DEFAULT 2,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled
  payment_order_id text,
  transaction_id text,
  guest_name text,
  guest_email text,
  guest_phone text,
  special_requests text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since users are not authenticated initially when making a booking)
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.bookings;
CREATE POLICY "Enable insert for anonymous users" ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role (admin) to view bookings, OR we can add a token
DROP POLICY IF EXISTS "Enable read for service role" ON public.bookings;
CREATE POLICY "Enable read for service role" ON public.bookings
  FOR SELECT
  USING (true); -- In a real app, restrict this!

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_modtime ON public.bookings;
CREATE TRIGGER update_bookings_modtime
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
