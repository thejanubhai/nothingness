-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  nightly_price NUMERIC NOT NULL,
  cleaning_fee NUMERIC NOT NULL DEFAULT 0,
  max_guests INTEGER NOT NULL,
  amenities JSONB,
  images TEXT[],
  featured_image TEXT,
  rules TEXT,
  coordinates JSONB,
  active BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  booking_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for Properties
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON properties;
CREATE POLICY "Public properties are viewable by everyone." ON properties
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Properties are fully managed by admins." ON properties;
CREATE POLICY "Properties are fully managed by admins." ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Policies for Bookings
DROP POLICY IF EXISTS "Users can view their own bookings." ON bookings;
CREATE POLICY "Users can view their own bookings." ON bookings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookings." ON bookings;
CREATE POLICY "Users can create their own bookings." ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Bookings are fully managed by admins." ON bookings;
CREATE POLICY "Bookings are fully managed by admins." ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );
