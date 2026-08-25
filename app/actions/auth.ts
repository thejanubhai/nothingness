'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminAuth } from '@/lib/firebase/admin';
import { normalizeIdentifier, getRedirectPath } from '@/lib/auth-utils';

/**
 * Hybrid Firebase Phone Auth -> Supabase Native Session bridge
 * Verifies the Firebase ID Token, computes a deterministic password,
 * creates/updates the user via Supabase Admin API with phone_confirm: true,
 * and sets native Supabase HTTP-only session cookies via signInWithPassword.
 */
export async function loginWithFirebasePhone(idToken: string) {
  try {
    if (!idToken) {
      return { error: 'Firebase ID token is required.', success: false };
    }

    // 1. Verify the Firebase ID Token and extract verified phone_number
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const rawPhoneNumber = decodedToken.phone_number;

    if (!rawPhoneNumber) {
      return { error: 'No phone number associated with verified Firebase token.', success: false };
    }

    const phone = normalizeIdentifier(rawPhoneNumber);

    // 2. Compute deterministic password via HMAC-SHA256 using SUPABASE_JWT_SECRET
    const jwtSecret =
      process.env.SUPABASE_JWT_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      'default-fallback-secret-key';
    const deterministicPassword = crypto
      .createHmac('sha256', jwtSecret)
      .update(phone)
      .digest('hex');

    // 3. Initialize Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY
    const supabaseAdmin = createAdminClient();

    // 4. Check if a user with this phone number exists in Supabase auth.users
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.warn('Warning querying user list from Supabase Admin:', listError.message);
    }

    const existingUser = usersData?.users?.find(
      (u) => u.phone && normalizeIdentifier(u.phone) === phone
    );

    if (existingUser) {
      // User exists: update password to deterministic password and ensure confirmed
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: deterministicPassword,
          phone_confirm: true,
        }
      );
      if (updateError) {
        console.error('Failed to update Supabase user password:', updateError);
        return { error: updateError.message, success: false };
      }
    } else {
      // User does NOT exist: create them with phone_confirm: true to bypass native OTP checks
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        password: deterministicPassword,
        phone_confirm: true,
      });

      if (createError) {
        // If user already exists (e.g. race condition or pagination), attempt password update
        if (createError.message?.toLowerCase().includes('already') || createError.status === 422) {
          const { data: retryUsersData } = await supabaseAdmin.auth.admin.listUsers();
          const retryUser = retryUsersData?.users?.find(
            (u) => u.phone && normalizeIdentifier(u.phone) === phone
          );
          if (retryUser) {
            await supabaseAdmin.auth.admin.updateUserById(retryUser.id, {
              password: deterministicPassword,
              phone_confirm: true,
            });
          } else {
            return { error: createError.message, success: false };
          }
        } else {
          console.error('Failed to create Supabase user:', createError);
          return { error: createError.message, success: false };
        }
      }
    }

    // 5. Use standard Next.js App Router Supabase Server Client (@supabase/ssr)
    // to execute signInWithPassword, seamlessly setting native Supabase HTTP-only session cookies
    const supabase = await createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      phone,
      password: deterministicPassword,
    });

    if (signInError || !signInData.user) {
      console.error('Failed to sign in with password in Supabase SSR client:', signInError);
      return {
        error: signInError?.message || 'Authentication session failed.',
        success: false,
      };
    }

    // 6. Automatically link any unlinked guest_profiles matching this phone number
    try {
      await supabaseAdmin
        .from('guest_profiles')
        .update({ user_id: signInData.user.id })
        .eq('phone', phone)
        .is('user_id', null);
    } catch (linkErr) {
      console.warn('Could not auto-link guest_profiles record:', linkErr);
    }

    revalidatePath('/', 'layout');
    const redirectUrl = getRedirectPath(signInData.user);

    return {
      success: true,
      redirectUrl,
    };
  } catch (error: any) {
    console.error('Error during Firebase phone login bridge:', error);
    return {
      error: error.message || 'Authentication failed. Please try again.',
      success: false,
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

  revalidatePath('/');
  redirect(getRedirectPath(user));
}
