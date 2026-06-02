ALTER TABLE public.guest_profiles
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.purge_old_guest_ids()
RETURNS void AS $$
BEGIN
  -- Anonymize and purge PII after 180 days to comply with data privacy policies
  UPDATE public.guest_profiles
  SET 
    document_number = NULL,
    id_document_type = NULL,
    is_verified = false
  WHERE is_verified = true 
  AND created_at < timezone('utc'::text, now()) - interval '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- If pg_cron is enabled on the project, schedule it to run daily at midnight
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule('purge_old_guest_ids_job', '0 0 * * *', 'SELECT public.purge_old_guest_ids()');
  END IF;
END $$;
