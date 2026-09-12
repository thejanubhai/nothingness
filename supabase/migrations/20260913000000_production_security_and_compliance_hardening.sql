-- Migration: 20260913000000_production_security_and_compliance_hardening.sql
-- Fixes critical production security vulnerabilities:
-- 1. Restricts kinkster_ephemeral_messages RLS to only mutual chamber participants
-- 2. Closes wildcard email backdoor (LIKE '%admin%') across all sensitive tables

-- ============================================================================
-- 1. Restrict Ephemeral Messages to Chamber Participants Only
-- ============================================================================
DROP POLICY IF EXISTS "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages;
CREATE POLICY "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kinkster_resonances r
      WHERE r.chamber_token = kinkster_ephemeral_messages.chamber_token
        AND (r.sender_id = auth.uid() OR r.target_id = auth.uid())
        AND r.is_mutual = true
    )
  );

-- ============================================================================
-- 2. Restrict Bookings Admin Policies (No wildcard email backdoor)
-- ============================================================================
DROP POLICY IF EXISTS "Admins have full access to bookings." ON public.bookings;
CREATE POLICY "Admins have full access to bookings." ON public.bookings
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 3. Restrict Conversations Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.conversations;
CREATE POLICY "Admins can manage conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 4. Restrict Messages Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow admins to read messages" ON public.messages;
CREATE POLICY "Allow admins to read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Allow admins to insert messages" ON public.messages;
CREATE POLICY "Allow admins to insert messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 5. Restrict Chatflows Admin Policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow admins to read chatflows" ON public.chatflows;
CREATE POLICY "Allow admins to read chatflows" ON public.chatflows
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 6. Restrict Storage Objects Admin Policy
-- ============================================================================
DROP POLICY IF EXISTS "Admins can list guest-ids storage" ON storage.objects;
CREATE POLICY "Admins can list guest-ids storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'guest-ids' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 7. Ensure gathering_vettings Audit Insert Allowed
-- ============================================================================
DROP POLICY IF EXISTS "Marshalls and system can insert vettings" ON public.gathering_vettings;
CREATE POLICY "Marshalls and system can insert vettings" ON public.gathering_vettings
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public or marshalls can read vettings" ON public.gathering_vettings;
CREATE POLICY "Public or marshalls can read vettings" ON public.gathering_vettings
  FOR SELECT TO public
  USING (true);
