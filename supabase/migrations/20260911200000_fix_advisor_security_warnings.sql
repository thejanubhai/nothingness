-- Migration: 20260911200000_fix_advisor_security_warnings.sql
-- Fixes Supabase Security Advisor warnings:
-- 1. function_search_path_mutable (5 functions)
-- 2. anon_security_definer_function_executable & authenticated_security_definer_function_executable (4 functions)
-- 3. public_bucket_allows_listing (storage.objects guest-ids listing)
-- 4. rls_policy_always_true (overly permissive RLS policies)

-- ============================================================================
-- 1. Fix Function Search Paths (0011_function_search_path_mutable)
-- ============================================================================
ALTER FUNCTION public.generate_housekeeping_tasks() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_booking_webhook() SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_old_guest_ids() SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_expired_ephemeral_messages() SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_auth_user_tokens_non_null() SET search_path = public, pg_temp;

-- ============================================================================
-- 2. Restrict Security Definer Function Permissions (0028 & 0029)
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.purge_expired_ephemeral_messages() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_ephemeral_messages() TO service_role;

REVOKE EXECUTE ON FUNCTION public.purge_old_guest_ids() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_guest_ids() TO service_role;

REVOKE EXECUTE ON FUNCTION public.trigger_booking_webhook() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_booking_webhook() TO service_role;

REVOKE EXECUTE ON FUNCTION public.sync_phone_auth_user(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_phone_auth_user(text, text) TO service_role;

-- ============================================================================
-- 3. Fix Storage Bucket Listing Policy (public_bucket_allows_listing)
-- ============================================================================
DROP POLICY IF EXISTS "Public guest-ids access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can list guest-ids storage" ON storage.objects;
CREATE POLICY "Admins can list guest-ids storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'guest-ids' AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() ->> 'email') LIKE '%admin%'
      OR (auth.jwt() ->> 'email') LIKE '%hudav%'
      OR (auth.jwt() ->> 'email') LIKE '%pedro%'
    )
  );

-- ============================================================================
-- 4. Fix Overly Permissive RLS Policies (0024_permissive_rls_policy)
-- ============================================================================

-- 4.1 articles
DROP POLICY IF EXISTS "Admins have full access to articles" ON public.articles;
CREATE POLICY "Admins have full access to articles" ON public.articles
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

-- 4.2 booking_guests
DROP POLICY IF EXISTS "Public can view and verify their booking_guest record" ON public.booking_guests;
DROP POLICY IF EXISTS "Enable all operations for booking_guests" ON public.booking_guests;
DROP POLICY IF EXISTS "Admins can manage booking_guests" ON public.booking_guests;
CREATE POLICY "Admins can manage booking_guests" ON public.booking_guests
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

DROP POLICY IF EXISTS "Public can view booking_guest records" ON public.booking_guests;
CREATE POLICY "Public can view booking_guest records" ON public.booking_guests
  FOR SELECT TO public
  USING (true);

-- 4.3 calendar_sync_sources
DROP POLICY IF EXISTS "Admins and sync engine manage calendar sync sources" ON public.calendar_sync_sources;
CREATE POLICY "Admins and sync engine manage calendar sync sources" ON public.calendar_sync_sources
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

-- 4.4 cms_content_blocks
DROP POLICY IF EXISTS "Authenticated modify cms blocks" ON public.cms_content_blocks;
DROP POLICY IF EXISTS "Admins modify cms blocks" ON public.cms_content_blocks;
CREATE POLICY "Admins modify cms blocks" ON public.cms_content_blocks
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

-- 4.5 contact_messages
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0 
    AND length(trim(email)) > 3 
    AND length(trim(message)) > 0
  );

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
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

-- 4.6 external_blocked_dates
DROP POLICY IF EXISTS "Sync engine manage external blocked dates" ON public.external_blocked_dates;
DROP POLICY IF EXISTS "Admins and sync engine manage external blocked dates" ON public.external_blocked_dates;
CREATE POLICY "Admins and sync engine manage external blocked dates" ON public.external_blocked_dates
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

-- 4.7 franchise_leads
DROP POLICY IF EXISTS "Public insert franchise_leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Service role read franchise_leads" ON public.franchise_leads;
DROP POLICY IF EXISTS "Anyone can submit franchise leads" ON public.franchise_leads;
CREATE POLICY "Anyone can submit franchise leads" ON public.franchise_leads
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0 
    AND length(trim(email)) > 3
  );

DROP POLICY IF EXISTS "Admins can manage franchise leads" ON public.franchise_leads;
CREATE POLICY "Admins can manage franchise leads" ON public.franchise_leads
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

-- 4.8 guest_profiles
DROP POLICY IF EXISTS "Anyone can insert guest profiles during verification" ON public.guest_profiles;
CREATE POLICY "Anyone can insert guest profiles during verification" ON public.guest_profiles
  FOR INSERT TO public
  WITH CHECK (
    length(trim(full_name)) > 0
  );

DROP POLICY IF EXISTS "Anyone can update guest profiles during verification" ON public.guest_profiles;
DROP POLICY IF EXISTS "Users can update own guest profile" ON public.guest_profiles;
CREATE POLICY "Users can update own guest profile" ON public.guest_profiles
  FOR UPDATE TO public
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (is_verified IS DISTINCT FROM true)
  )
  WITH CHECK (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR (is_verified IS DISTINCT FROM true)
  );

DROP POLICY IF EXISTS "Admins can manage guest profiles" ON public.guest_profiles;
CREATE POLICY "Admins can manage guest profiles" ON public.guest_profiles
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

-- 4.9 kinkster_ephemeral_messages
DROP POLICY IF EXISTS "Allow members update ephemeral messages" ON public.kinkster_ephemeral_messages;
CREATE POLICY "Allow members update ephemeral messages" ON public.kinkster_ephemeral_messages
  FOR UPDATE TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 4.10 lounge_access_logs
DROP POLICY IF EXISTS "Partners can view lounge logs" ON public.lounge_access_logs;
CREATE POLICY "Partners can view lounge logs" ON public.lounge_access_logs
  FOR SELECT TO authenticated
  USING (
    partner_property_id IN (
      SELECT p.id FROM public.partner_properties p
      JOIN public.partner_profiles pp ON p.partner_id = pp.id
      WHERE pp.user_id = (SELECT auth.uid())
    )
    OR user_id = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

DROP POLICY IF EXISTS "Admins can manage lounge logs" ON public.lounge_access_logs;
CREATE POLICY "Admins can manage lounge logs" ON public.lounge_access_logs
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

-- 4.11 media_assets
DROP POLICY IF EXISTS "Authenticated users manage media" ON public.media_assets;
DROP POLICY IF EXISTS "Admins and uploaders manage media" ON public.media_assets;
CREATE POLICY "Admins and uploaders manage media" ON public.media_assets
  FOR ALL TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  )
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
    OR (auth.jwt() ->> 'email') LIKE '%admin%' 
    OR (auth.jwt() ->> 'email') LIKE '%hudav%' 
    OR (auth.jwt() ->> 'email') LIKE '%pedro%'
  );

-- 4.12 platform_settings
DROP POLICY IF EXISTS "Authenticated users can modify platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can modify platform settings" ON public.platform_settings;
CREATE POLICY "Admins can modify platform settings" ON public.platform_settings
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

-- 4.13 sanctuary_event_applications
DROP POLICY IF EXISTS "Admin manage all applications" ON public.sanctuary_event_applications;
CREATE POLICY "Admin manage all applications" ON public.sanctuary_event_applications
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

-- 4.14 sanctuary_events
DROP POLICY IF EXISTS "Admin manage events" ON public.sanctuary_events;
CREATE POLICY "Admin manage events" ON public.sanctuary_events
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

-- 4.15 sanctuary_pass_settings
DROP POLICY IF EXISTS "Admin manage settings" ON public.sanctuary_pass_settings;
CREATE POLICY "Admin manage settings" ON public.sanctuary_pass_settings
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

-- 4.16 sanctuary_passes
DROP POLICY IF EXISTS "Admin manage passes" ON public.sanctuary_passes;
CREATE POLICY "Admin manage passes" ON public.sanctuary_passes
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

-- 4.17 spaces
DROP POLICY IF EXISTS "Admins and API manage spaces" ON public.spaces;
CREATE POLICY "Admins and API manage spaces" ON public.spaces
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
