import { env } from './env';

export function normalizeIdentifier(identifier: string): string {
  if (!identifier) return '';
  // Clean all characters except digits and leading +
  let raw = identifier.trim().replace(/[^0-9+]/g, '');

  if (raw.startsWith('+')) {
    raw = raw.slice(1);
  }

  // If starts with 0 (e.g. 08527976791), strip leading 0
  if (raw.startsWith('0') && raw.length === 11) {
    raw = raw.slice(1);
  }

  // If 10 digits (standard Indian mobile number), prepend 91
  if (raw.length === 10) {
    raw = `91${raw}`;
  }

  return `+${raw}`;
}

export function isUserAdmin(
  user: {
    id?: string;
    phone?: string;
    email?: string;
    user_metadata?: any;
    app_metadata?: any;
    identities?: Array<{ provider: string; identity_data?: any }>;
  } | null | undefined
): boolean {
  if (!user) return false;

  const rawAdmin = process.env.ADMIN || env.ADMIN;
  if (!rawAdmin || rawAdmin.trim().length < 8) {
    return false;
  }

  const adminNumbers = rawAdmin
    .split(',')
    .map((num) => normalizeIdentifier(num.trim()))
    .filter((num) => num.length >= 10);

  if (adminNumbers.length === 0) return false;

  // 1. Direct phone match
  const userPhone = user.phone ? normalizeIdentifier(user.phone) : null;
  if (userPhone && adminNumbers.includes(userPhone)) {
    return true;
  }

  // 2. Metadata phone match (Passkeys & Biometric credentials)
  if (user.user_metadata?.phone) {
    const metaPhone = normalizeIdentifier(user.user_metadata.phone);
    if (adminNumbers.includes(metaPhone)) return true;
  }

  // 3. App metadata phone match
  if (user.app_metadata?.phone) {
    const appPhone = normalizeIdentifier(user.app_metadata.phone);
    if (adminNumbers.includes(appPhone)) return true;
  }

  // 4. Linked Identities match (e.g. Google OAuth linked to phone identity)
  if (user.identities && Array.isArray(user.identities)) {
    for (const identity of user.identities) {
      if (identity.identity_data?.phone) {
        const idPhone = normalizeIdentifier(identity.identity_data.phone);
        if (adminNumbers.includes(idPhone)) return true;
      }
    }
  }

  // 5. Synthetic email match (e.g. 919910778576@auth.nothingness.asia or 919910778576@auth.nothingness)
  if (user.email && (user.email.includes('@auth.nothingness.asia') || user.email.includes('@auth.nothingness'))) {
    const rawDigits = user.email.split('@')[0];
    if (adminNumbers.includes(normalizeIdentifier(rawDigits))) {
      return true;
    }
  }

  return false;
}

export async function isUserAdminAsync(user: any): Promise<boolean> {
  if (!user) return false;

  // 1. Fast in-memory check
  if (isUserAdmin(user)) return true;

  // 2. If user logged in via Google OAuth or Passkey without phone directly in JWT,
  // check if this user ID is linked to the Admin phone in guest_profiles
  if (user.id) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();

      const rawAdmin = process.env.ADMIN || env.ADMIN;
      if (!rawAdmin) return false;
      const adminNumbers = rawAdmin
        .split(',')
        .map((num) => normalizeIdentifier(num.trim()))
        .filter((num) => num.length >= 10);

      const { data: profile } = await adminClient
        .from('guest_profiles')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.phone && adminNumbers.includes(normalizeIdentifier(profile.phone))) {
        return true;
      }
    } catch (_) {}
  }

  return false;
}

export async function getRedirectPath(user: { email?: string; phone?: string; user_metadata?: any; id?: string } | null): Promise<string> {
  const isAdmin = await isUserAdminAsync(user);
  if (isAdmin) {
    return '/admin';
  }
  return '/dashboard';
}
