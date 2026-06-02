-- Create a dummy function to satisfy the auth hook config without failing
CREATE OR REPLACE FUNCTION public.custom_email_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simply return the event unmodified so the hook succeeds silently
  RETURN event;
END;
$$;

-- Ensure auth admin has execution rights
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.custom_email_hook(jsonb) TO supabase_auth_admin;
