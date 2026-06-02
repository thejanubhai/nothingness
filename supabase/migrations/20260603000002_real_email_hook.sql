-- Replace the dummy email hook with a real HTML generator for Supabase Custom SMTP
CREATE OR REPLACE FUNCTION public.custom_email_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_type text := event->'email_data'->>'email_action_type';
  token_hash text := event->'email_data'->>'token_hash';
  redirect_to text := event->'email_data'->>'redirect_to';
  site_url text := event->'email_data'->>'site_url';
  
  magic_link text;
  html_body text;
  subject_text text;
  result jsonb;
BEGIN
  -- Construct the secure callback link based on Supabase's PKCE/Hash architecture
  magic_link := site_url || '/auth/callback?token_hash=' || token_hash || '&type=' || email_type || '&next=' || redirect_to;

  IF email_type = 'signup' THEN
    subject_text := 'Welcome to Nothingness';
    html_body := '
      <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
        <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Welcome to Nothingness</h2>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Please confirm your email address to access your Guest Portal.</p>
        <a href="' || magic_link || '" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Confirm Email</a>
      </div>
    ';
  ELSIF email_type = 'magiclink' THEN
    subject_text := 'Your Access Portal Link';
    html_body := '
      <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
        <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Guest Portal Access</h2>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Click the button below to securely sign into your Nothingness account.</p>
        <a href="' || magic_link || '" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Enter Portal</a>
      </div>
    ';
  ELSIF email_type = 'email_change' THEN
    subject_text := 'Confirm your new email address';
    html_body := '
      <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
        <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Email Update Request</h2>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">We received a request to update the email address linked to your Nothingness profile. Click below to verify this change.</p>
        <a href="' || magic_link || '" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Verify New Email</a>
      </div>
    ';
  ELSIF email_type = 'recovery' THEN
    subject_text := 'Reset your password';
    html_body := '
      <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
        <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Password Reset</h2>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Click the button below to reset your Nothingness account password.</p>
        <a href="' || magic_link || '" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Reset Password</a>
      </div>
    ';
  ELSE
    subject_text := 'Message from Nothingness';
    html_body := '
      <div style="font-family: Arial, sans-serif; background-color: #080808; color: #F5F5F5; padding: 40px; text-align: center;">
        <h2 style="color: #D4AF37; font-family: serif; font-size: 24px; margin-bottom: 20px;">Notice</h2>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 30px;">Please click the link below to proceed.</p>
        <a href="' || magic_link || '" style="background-color: #D4AF37; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Proceed</a>
      </div>
    ';
  END IF;

  -- Construct the required Supabase Auth "request" JSON payload
  result := jsonb_build_object(
    'request', jsonb_build_object(
      'html', html_body,
      'subject', subject_text,
      'text', 'Please visit ' || magic_link || ' to proceed.'
    )
  );

  RETURN result;
END;
$$;

-- Ensure auth admin has execution rights
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.custom_email_hook(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.custom_email_hook(jsonb) TO supabase_auth_admin;
