'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normalizeIdentifier, getRedirectPath } from '@/lib/auth-utils';

export async function sendOtp(prevState: any, formData: FormData) {
  const phoneInput = formData.get('identifier') as string;
  const phone = normalizeIdentifier(phoneInput);
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    }
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { 
    success: true, 
    identifier: phone,
    message: 'OTP sent successfully!' 
  };
}

export async function verifyOtp(prevState: any, formData: FormData) {
  const phoneInput = formData.get('identifier') as string;
  const token = formData.get('token') as string;
  
  const phone = normalizeIdentifier(phoneInput);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  redirect(getRedirectPath(data.user));
}

export async function signOut(formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function onPasskeyLoginSuccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Failed to retrieve session after passkey login.' };
  }

  revalidatePath('/');
  redirect(getRedirectPath(user));
}
