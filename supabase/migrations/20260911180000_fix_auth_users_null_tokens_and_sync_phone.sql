-- Migration: 20260911180000_fix_auth_users_null_tokens_and_sync_phone.sql
-- Fixes auth.users null token scanning error in GoTrue and PostgreSQL 17 generated column in sync_phone_auth_user

-- 1. Ensure all existing auth.users have non-null token strings to prevent GoTrue scanning crashes
UPDATE auth.users 
SET confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL 
   OR email_change_token_new IS NULL 
   OR email_change IS NULL;

-- 2. Trigger function to ensure future inserts/updates on auth.users never have NULL tokens
CREATE OR REPLACE FUNCTION public.ensure_auth_user_tokens_non_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_token IS NULL THEN
    NEW.confirmation_token := '';
  END IF;
  IF NEW.recovery_token IS NULL THEN
    NEW.recovery_token := '';
  END IF;
  IF NEW.email_change_token_new IS NULL THEN
    NEW.email_change_token_new := '';
  END IF;
  IF NEW.email_change IS NULL THEN
    NEW.email_change := '';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_auth_user_tokens_non_null ON auth.users;
CREATE TRIGGER trg_ensure_auth_user_tokens_non_null
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_auth_user_tokens_non_null();

-- 3. Update sync_phone_auth_user function:
-- - Removes confirmed_at from UPDATE and INSERT statements (in PostgreSQL 17, confirmed_at is ALWAYS GENERATED)
-- - Explicitly inserts empty strings for tokens to avoid NULLs
CREATE OR REPLACE FUNCTION public.sync_phone_auth_user(
  p_phone TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_clean_digits TEXT;
  v_synthetic_email TEXT;
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_user_record RECORD;
BEGIN
  -- Extract digits
  v_clean_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_clean_digits) = 10 THEN
    v_clean_digits := '91' || v_clean_digits;
  END IF;

  v_synthetic_email := v_clean_digits || '@auth.nothingness.asia';
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Find existing user by phone or synthetic email
  SELECT * INTO v_user_record FROM auth.users
  WHERE phone = v_clean_digits 
     OR phone = ('+' || v_clean_digits)
     OR email = v_synthetic_email
  LIMIT 1;

  IF v_user_record.id IS NOT NULL THEN
    v_user_id := v_user_record.id;
    UPDATE auth.users
    SET 
      email = COALESCE(v_user_record.email, v_synthetic_email),
      email_confirmed_at = COALESCE(v_user_record.email_confirmed_at, NOW()),
      phone = v_clean_digits,
      phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
      encrypted_password = v_encrypted_pw,
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      updated_at = NOW()
    WHERE id = v_user_id;

    -- Ensure identity exists and conforms to GoTrue requirements (provider_id = user_id::text)
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email') THEN
      INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id::text,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', COALESCE(v_user_record.email, v_synthetic_email), 'email_verified', true),
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    ELSE
      -- Repair existing identity record if provider_id was corrupted or mismatched
      UPDATE auth.identities
      SET 
        provider_id = v_user_id::text,
        identity_data = jsonb_build_object('sub', v_user_id::text, 'email', COALESCE(v_user_record.email, v_synthetic_email), 'email_verified', true),
        updated_at = NOW()
      WHERE user_id = v_user_id AND provider = 'email' AND provider_id != v_user_id::text;
    END IF;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      email_confirmed_at,
      phone,
      phone_confirmed_at,
      encrypted_password,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      is_sso_user,
      is_anonymous
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_synthetic_email,
      NOW(),
      v_clean_digits,
      NOW(),
      v_encrypted_pw,
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email","phone"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      false,
      false,
      false
    );

    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_synthetic_email, 'email_verified', true, 'phone', v_clean_digits),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Auto-link any matching guest profiles
  UPDATE public.guest_profiles
  SET user_id = v_user_id
  WHERE (phone = v_clean_digits OR phone = ('+' || v_clean_digits)) AND user_id IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'phone', v_clean_digits,
    'email', COALESCE(v_user_record.email, v_synthetic_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_phone_auth_user(TEXT, TEXT) TO anon, authenticated, service_role;
