-- Use pg_net to POST the email event to our Next.js API route where Resend will securely handle it.
CREATE OR REPLACE FUNCTION public.custom_email_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  site_url text;
  webhook_secret text;
  request_id bigint;
BEGIN
  -- Determine the site URL dynamically from the event, fallback to production
  site_url := event->'email_data'->>'site_url';
  IF site_url IS NULL OR site_url = '' THEN
    site_url := 'https://nothingness.asia';
  END IF;

  webhook_secret := current_setting('app.settings.auth_webhook_secret', true);
  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    webhook_secret := 'secret-auth-hook-token-123';
  END IF;

  -- Call our Next.js webhook asynchronously using pg_net
  SELECT net.http_post(
      url := site_url || '/api/webhooks/auth-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := event
  ) INTO request_id;

  -- Return the event unmodified so Supabase Auth knows the hook succeeded
  RETURN event;
END;
$$;

-- Secure the function so only the GoTrue (supabase_auth_admin) role can execute it
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.custom_email_hook(jsonb) TO supabase_auth_admin;
