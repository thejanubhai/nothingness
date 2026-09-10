-- Fix RLS policies on spaces and bookings to eliminate auth.users table permission denial

-- 1. SPACES POLICIES
DROP POLICY IF EXISTS "Properties are fully managed by admins." ON spaces;
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON spaces;
DROP POLICY IF EXISTS "Spaces are fully managed by admins." ON spaces;
DROP POLICY IF EXISTS "Public spaces are viewable by everyone." ON spaces;
DROP POLICY IF EXISTS "Admins have full access to spaces." ON spaces;

CREATE POLICY "Public spaces are viewable by everyone." ON spaces
  FOR SELECT USING (true);

CREATE POLICY "Admins have full access to spaces." ON spaces
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

DROP POLICY IF EXISTS "Admins can view all bookings." ON bookings;
DROP POLICY IF EXISTS "Bookings are fully managed by admins." ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings." ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings." ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings." ON bookings;
DROP POLICY IF EXISTS "Anyone can view booking dates for availability" ON bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings." ON bookings;

CREATE POLICY "Anyone can view booking dates for availability" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own bookings." ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings." ON bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to bookings." ON bookings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );
