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
  if (!user || !env.ADMIN) return '/dashboard';
  
  // Strictly check against the phone number, as mobile is our sole unique identifier.
  const adminIdentifier = env.ADMIN.trim();
  const userPhone = user.phone?.trim();
  
  if (userPhone === adminIdentifier) {
    return '/admin';
  }
  
  return '/dashboard';
}
