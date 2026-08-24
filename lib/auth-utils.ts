import { env } from './env';

export function normalizeIdentifier(identifier: string): string {
  // Clean phone number of spaces/dashes
  let phone = identifier.replace(/[^0-9+]/g, '');
  
  // If no country code, assume +91 (India)
  if (!phone.startsWith('+')) {
    phone = `+91${phone}`;
  }
  
  return phone;
}

export function getRedirectPath(user: { email?: string; phone?: string } | null): string {
  if (!user) return '/dashboard';
  
  const adminIdentifier = env.ADMIN ? normalizeIdentifier(env.ADMIN) : null;
  const userPhone = user.phone ? normalizeIdentifier(user.phone) : null;
  
  const isAdminPhone = adminIdentifier && userPhone === adminIdentifier;
  const isAdminEmail = Boolean(user.email && (user.email.includes('admin') || user.email.includes('hudav')));

  if (isAdminPhone || isAdminEmail) {
    return '/admin';
  }
  
  return '/dashboard';
}
