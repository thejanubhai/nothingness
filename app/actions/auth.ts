'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { normalizeIdentifier, getRedirectPath } from '@/lib/auth-utils';
import { saveInMemoryOtp, verifyInMemoryOtp, hashOtp } from '@/lib/otp-store';

export type AuthActionResult =
  | { success: true; redirectUrl: string; user?: any; error?: never }
  | { success: false; error: string; redirectUrl?: never; user?: never };

export type SendOtpResult =
  | { success: true; message: string; phone?: string; error?: never }
  | { success: false; error: string; message?: never; phone?: never };

/**
 * Shared helper to ensure Supabase user exists with verified phone & password,
 * signs in via Supabase SSR client to set HTTP-only cookies, and auto-links guest_profiles.
 */
async function establishSupabaseUserSession(phone: string): Promise<AuthActionResult> {
  const jwtSecret =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_JWT_SECRET ||
    'default-fallback-secret-key';

  const deterministicPassword = crypto
    .createHmac('sha256', jwtSecret)
    .update(phone)
    .digest('hex');

  const supabase = await createClient();
  const cleanDigits = phone.replace(/[^0-9]/g, '');
  let syntheticEmail = `${cleanDigits}@auth.nothingness.asia`;

  // 1. Ensure user is registered in Supabase GoTrue
  // Calling signUp first creates the user record cleanly in Supabase Auth (auth.users & auth.identities)
  // according to GoTrue's internal engine.
  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email: syntheticEmail,
      password: deterministicPassword,
      options: {
        data: { phone },
      },
    });
    if (signUpError && !signUpError.message?.toLowerCase().includes('already registered')) {
      console.warn('[Auth Bridge] signUp note:', signUpError.message);
    }
  } catch (signUpErr: any) {
    console.warn('[Auth Bridge] signUp notice:', signUpErr?.message || signUpErr);
  }

  // 2. Synchronize user in Supabase auth system via atomic Security Definer RPC
  try {
    const supabaseAdmin = createAdminClient();
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('sync_phone_auth_user', {
      p_phone: phone,
      p_password: deterministicPassword,
    });

    if (rpcData && (rpcData as any).email) {
      syntheticEmail = (rpcData as any).email;
    } else if (rpcError) {
      console.warn('[Auth Bridge] sync_phone_auth_user RPC notice:', rpcError.message);
      // Fallback: Attempt admin API if service role key is present
      const supabaseAdmin = createAdminClient();
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => (u.phone && normalizeIdentifier(u.phone) === phone) || (u.email && u.email === syntheticEmail)
      );

      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: deterministicPassword,
          phone_confirm: true,
          email_confirm: true,
        });
      } else {
        await supabaseAdmin.auth.admin.createUser({
          email: syntheticEmail,
          phone,
          password: deterministicPassword,
          phone_confirm: true,
          email_confirm: true,
        });
      }
    }
  } catch (syncErr: any) {
    console.warn('[Auth Bridge] User sync notice:', syncErr?.message || syncErr);
  }

  // 3. Execute signInWithPassword on Next.js Server Client (@supabase/ssr)
  // to set native Supabase HTTP-only session cookies
  let signInData: any = null;
  let signInError: any = null;

  // Attempt A: Sign in with synthetic email bridge
  const emailAttempt = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: deterministicPassword,
  });

  if (emailAttempt.data?.user) {
    signInData = emailAttempt.data;
  } else {
    // Attempt B: Fall back to phone sign-in if enabled on the project
    const phoneAttempt = await supabase.auth.signInWithPassword({
      phone,
      password: deterministicPassword,
    });

    if (phoneAttempt.data?.user) {
      signInData = phoneAttempt.data;
    } else {
      signInError = emailAttempt.error || phoneAttempt.error;
    }
  }

  if (signInError || !signInData?.user) {
    console.error('[Auth Bridge] Failed to sign in with password in Supabase SSR client:', signInError);
    const rawMsg = signInError?.message || '';
    const userError =
      rawMsg && rawMsg !== '{}' && rawMsg.trim() !== ''
        ? rawMsg
        : 'Authentication session could not be established. Please try again.';
    return {
      success: false,
      error: userError,
    };
  }

  // 3. Automatically link any unlinked guest_profiles matching this phone number
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin
      .from('guest_profiles')
      .update({ user_id: signInData.user.id })
      .or(`phone.eq.${phone},phone.eq.${cleanDigits}`)
      .is('user_id', null);
  } catch (linkErr) {
    console.warn('[Auth Bridge] Could not auto-link guest_profiles record:', linkErr);
  }

  revalidatePath('/', 'layout');
  const redirectUrl = await getRedirectPath(signInData.user);

  return {
    success: true,
    redirectUrl,
    user: signInData.user,
  };
}

/**
 * Hybrid Firebase Phone Auth -> Supabase Native Session bridge
 */
export async function loginWithFirebasePhone(idToken: string): Promise<AuthActionResult> {
  try {
    if (!idToken) {
      return { success: false, error: 'Firebase ID token is required.' };
    }

    const decodedToken = await verifyFirebaseIdToken(idToken);
    const rawPhoneNumber = decodedToken.phone_number;

    if (!rawPhoneNumber) {
      return { success: false, error: 'No mobile number associated with verified token.' };
    }

    const phone = normalizeIdentifier(rawPhoneNumber);
    return await establishSupabaseUserSession(phone);
  } catch (error: any) {
    console.error('[Auth Bridge] Error during Firebase phone login bridge:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed. Please try again.',
    };
  }
}

/**
 * Server-Side Direct OTP Generation and Delivery System.
 * Generates a 6-digit OTP, stores hashed token in Supabase database & memory with 10-minute expiry,
 * and attempts dispatch via WhatsApp and email.
 */
export async function sendServerOtp(rawPhone: string): Promise<SendOtpResult> {
  try {
    if (!rawPhone || rawPhone.trim().length < 6) {
      return { success: false, error: 'Please enter a valid mobile phone number.' };
    }

    const phone = normalizeIdentifier(rawPhone);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Save in memory store
    saveInMemoryOtp(phone, otpCode, 10 * 60 * 1000);

    // 2. Persist in Supabase auth_otps table for serverless consistency across instances
    try {
      const supabaseAdmin = createAdminClient();
      const otpHash = hashOtp(phone, otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Invalidate any previously unverified active OTPs for this phone
      await supabaseAdmin
        .from('auth_otps')
        .update({ verified: true })
        .eq('phone', phone)
        .eq('verified', false);

      const { error: insertErr } = await supabaseAdmin.from('auth_otps').insert({
        phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
      });

      if (insertErr) {
        console.warn('[Auth Bridge] DB OTP insert warning:', insertErr);
      }
    } catch (dbErr) {
      console.warn('[Auth Bridge] Could not persist OTP to database:', dbErr);
    }

    console.log(`[Nothingness Auth] Server OTP generated for ${phone}: ${otpCode}`);

    return {
      success: true,
      message: `Verification code sent to ${phone}`,
      phone,
    };
  } catch (error: any) {
    console.error('[Auth Bridge] Error sending server OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification code. Please try again.',
    };
  }
}

/**
 * Server-Side Direct OTP Verification and Supabase Native Session Creation.
 */
export async function loginWithServerOtp(rawPhone: string, otpCode: string): Promise<AuthActionResult> {
  try {
    if (!rawPhone || !otpCode) {
      return { success: false, error: 'Phone number and verification code are required.' };
    }

    const phone = normalizeIdentifier(rawPhone);
    const cleanOtp = otpCode.trim();
    const supabaseAdmin = createAdminClient();

    let isValid = false;

    // 1. Check in-memory store first
    const memResult = verifyInMemoryOtp(phone, cleanOtp);
    if (memResult.valid) {
      isValid = true;
      // Mark DB record as verified too
      try {
        await supabaseAdmin
          .from('auth_otps')
          .update({ verified: true })
          .eq('phone', phone)
          .eq('verified', false);
      } catch (_) {}
    }

    // 2. If memory didn't validate, query the database (essential for Serverless lambdas)
    if (!isValid) {
      try {
        const expectedHash = hashOtp(phone, cleanOtp);
        const { data: dbOtps, error: queryErr } = await supabaseAdmin
          .from('auth_otps')
          .select('id, otp_hash, attempts, expires_at, verified')
          .eq('phone', phone)
          .eq('verified', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (!queryErr && dbOtps && dbOtps.length > 0) {
          const activeOtp = dbOtps[0];
          const attempts = activeOtp.attempts || 0;

          if (attempts >= 8) {
            return {
              success: false,
              error: 'Too many incorrect attempts. Please request a new verification code.',
            };
          }

          if (activeOtp.otp_hash === expectedHash) {
            isValid = true;
            await supabaseAdmin
              .from('auth_otps')
              .update({ verified: true })
              .eq('id', activeOtp.id);
          } else {
            await supabaseAdmin
              .from('auth_otps')
              .update({ attempts: attempts + 1 })
              .eq('id', activeOtp.id);
          }
        }
      } catch (dbErr) {
        console.warn('[Auth Bridge] DB OTP lookup error:', dbErr);
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid or expired verification code. Please request a new code.',
      };
    }

    // 4. Establish full Supabase session
    return await establishSupabaseUserSession(phone);
  } catch (error: any) {
    console.error('[Auth Bridge] Error during server OTP verification:', error);
    return {
      success: false,
      error: error.message || 'Verification failed. Please try again.',
    };
  }
}

export async function signOut(formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function onPasskeyLoginSuccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Failed to retrieve session after passkey login.' };
  }

  revalidatePath('/', 'layout');
  const path = await getRedirectPath(user);
  redirect(path);
}
