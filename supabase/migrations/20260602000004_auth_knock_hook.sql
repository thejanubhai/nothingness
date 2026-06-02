-- Create a custom email hook function to route OTPs to our Next.js backend (which uses Knock)
CREATE OR REPLACE FUNCTION public.custom_email_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  site_url text;
  webhook_secret text;
  request_id bigint;
BEGIN
  -- We default to the production URL, but this can be overridden via database settings
  site_url := current_setting('app.settings.nextjs_url', true);
  if site_url is null or site_url = '' then
    site_url := 'https://nothingness.asia';
  end if;

  webhook_secret := current_setting('app.settings.auth_webhook_secret', true);
  if webhook_secret is null or webhook_secret = '' then
    webhook_secret := 'secret-auth-hook-token-123';
  end if;

  -- Call the Next.js webhook asynchronously using pg_net
  -- Note: pg_net extension must be enabled (Supabase enables it by default)
  select net.http_post(
      url := site_url || '/api/auth/send-otp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := event
  ) into request_id;

  -- Return the event unmodified to indicate success
  RETURN event;
END;
$$;

-- Secure the function so only the GoTrue (supabase_auth_admin) role can execute it
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.custom_email_hook(jsonb) TO supabase_auth_admin;
