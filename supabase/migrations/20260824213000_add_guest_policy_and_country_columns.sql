-- 1. Update spaces table with missing country, state, and guest pricing policy columns
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Delhi';
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS default_guests INTEGER NOT NULL DEFAULT 2;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS max_additional_guests INTEGER NOT NULL DEFAULT 2;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS additional_guest_fee NUMERIC NOT NULL DEFAULT 500;

-- 2. Update bookings table with additional guest tracking and payment mode
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS default_guests INTEGER DEFAULT 2;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_guests_count INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_guest_fee_per_night NUMERIC DEFAULT 500;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_guest_total_amount NUMERIC DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_guest_payment_mode TEXT DEFAULT 'primary_pays';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;

-- 3. Update booking_guests table for individual guest payment & verification tracking
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_required';
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS payment_order_id TEXT;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE booking_guests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. Enable RLS permissions on booking_guests for verification flows
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view and verify their booking_guest record" ON booking_guests;
CREATE POLICY "Public can view and verify their booking_guest record" ON booking_guests
  FOR ALL USING (true)
  WITH CHECK (true);
