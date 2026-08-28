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
