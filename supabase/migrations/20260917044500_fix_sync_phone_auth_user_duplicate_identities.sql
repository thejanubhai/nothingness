-- Migration: 20260917044500_fix_sync_phone_auth_user_duplicate_identities.sql
-- Fixes unique constraint violation (identities_provider_id_provider_unique) in sync_phone_auth_user
-- when a user has multiple or stale identity records for provider 'email'.

-- 1. Clean up existing duplicate email identities across all users, keeping the canonical one (matching user_id::text)
DELETE FROM auth.identities
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY user_id, provider 
        ORDER BY (provider_id = user_id::text) DESC, created_at ASC
      ) as rn
    FROM auth.identities
    WHERE provider = 'email'
  ) t WHERE rn > 1
);

-- 2. Update sync_phone_auth_user function with defensive duplicate identity cleanup and actual email resolution
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
  v_actual_email TEXT;
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
    v_actual_email := COALESCE(v_user_record.email, v_synthetic_email);

    UPDATE auth.users
    SET 
      email = v_actual_email,
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

    -- Clean up any duplicate or stale email identities for this user
    IF EXISTS (
      SELECT 1 FROM auth.identities 
      WHERE user_id = v_user_id AND provider = 'email' AND provider_id = v_user_id::text
    ) THEN
      DELETE FROM auth.identities 
      WHERE user_id = v_user_id 
        AND provider = 'email' 
        AND provider_id != v_user_id::text;

      UPDATE auth.identities
      SET 
        identity_data = jsonb_build_object(
          'sub', v_user_id::text, 
          'email', v_actual_email, 
          'email_verified', true,
          'phone', v_clean_digits
        ),
        updated_at = NOW()
      WHERE user_id = v_user_id AND provider = 'email' AND provider_id = v_user_id::text;
    ELSIF EXISTS (
      SELECT 1 FROM auth.identities 
      WHERE user_id = v_user_id AND provider = 'email'
    ) THEN
      DELETE FROM auth.identities 
      WHERE user_id = v_user_id 
        AND provider = 'email' 
        AND id NOT IN (
          SELECT id FROM auth.identities WHERE user_id = v_user_id AND provider = 'email' LIMIT 1
        );

      UPDATE auth.identities
      SET 
        provider_id = v_user_id::text,
        identity_data = jsonb_build_object(
          'sub', v_user_id::text, 
          'email', v_actual_email, 
          'email_verified', true,
          'phone', v_clean_digits
        ),
        updated_at = NOW()
      WHERE user_id = v_user_id AND provider = 'email';
    ELSE
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
        jsonb_build_object(
          'sub', v_user_id::text, 
          'email', v_actual_email, 
          'email_verified', true,
          'phone', v_clean_digits
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    END IF;
  ELSE
    v_user_id := gen_random_uuid();
    v_actual_email := v_synthetic_email;

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
    'email', v_actual_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_phone_auth_user(TEXT, TEXT) TO service_role;
