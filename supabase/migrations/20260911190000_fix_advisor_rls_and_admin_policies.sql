-- Migration: 20260911190000_fix_advisor_rls_and_admin_policies.sql
-- Fixes Supabase Advisor security errors:
-- 1. Enables RLS on bookings, conversations, messages, listings, whatsapp_business_sessions
-- 2. Eliminates user_metadata references in RLS policies (replaces with app_metadata)

-- 1. Enable RLS on public tables missing RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_business_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Fix bookings admin policy (eliminate user_metadata reference)
DROP POLICY IF EXISTS "Admins have full access to bookings." ON public.bookings;
CREATE POLICY "Admins have full access to bookings." ON public.bookings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%'
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 3. Fix chatflows admin policy (eliminate user_metadata reference)
DROP POLICY IF EXISTS "Allow admins to read chatflows" ON public.chatflows;
CREATE POLICY "Allow admins to read chatflows" ON public.chatflows
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 4. Fix messages admin policies (eliminate user_metadata reference)
DROP POLICY IF EXISTS "Allow admins to read messages" ON public.messages;
CREATE POLICY "Allow admins to read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

DROP POLICY IF EXISTS "Allow admins to insert messages" ON public.messages;
CREATE POLICY "Allow admins to insert messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 5. Fix conversations admin policy
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.conversations;
CREATE POLICY "Admins can manage conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 6. Add policies for listings
DROP POLICY IF EXISTS "Public read listings" ON public.listings;
CREATE POLICY "Public read listings" ON public.listings
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins manage listings" ON public.listings;
CREATE POLICY "Admins manage listings" ON public.listings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 7. Add policies for whatsapp_business_sessions
DROP POLICY IF EXISTS "Admins manage whatsapp_business_sessions" ON public.whatsapp_business_sessions;
CREATE POLICY "Admins manage whatsapp_business_sessions" ON public.whatsapp_business_sessions
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );
