-- Fix guest_profiles RLS policies to eliminate auth.users table permission denial

DROP POLICY IF EXISTS "Admins can manage guest_profiles" ON guest_profiles;
DROP POLICY IF EXISTS "Anyone can select guest profiles during verification" ON guest_profiles;
DROP POLICY IF EXISTS "Guest profiles are viewable by admins and verification" ON guest_profiles;

CREATE POLICY "Guest profiles are viewable by admins and verification" ON guest_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert guest profiles during verification" ON guest_profiles;
CREATE POLICY "Anyone can insert guest profiles during verification" ON guest_profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update guest profiles during verification" ON guest_profiles;
CREATE POLICY "Anyone can update guest profiles during verification" ON guest_profiles
  FOR UPDATE USING (true) WITH CHECK (true);
