import crypto from 'crypto';

interface StoredOtp {
  hash: string;
  expiresAt: number;
  attempts: number;
}

// Global in-memory OTP store (survives hot-reloads via globalThis in Node.js)
const globalOtpMap = ((globalThis as any).__nothingness_otp_store ??= new Map<string, StoredOtp>());

const OTP_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_JWT_SECRET ||
  'nothingness-otp-secret-key-salt';

export function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${phone.trim()}:${otp.trim()}`)
    .digest('hex');
}

export function saveInMemoryOtp(phone: string, otp: string, ttlMs: number = 10 * 60 * 1000): void {
  const hash = hashOtp(phone, otp);
  globalOtpMap.set(phone, {
    hash,
    expiresAt: Date.now() + ttlMs,
    attempts: 0,
  });
}

export function verifyInMemoryOtp(phone: string, inputOtp: string): { valid: boolean; error?: string; notFound?: boolean } {
  const record = globalOtpMap.get(phone);
  if (!record) {
    return { valid: false, notFound: true, error: 'No active OTP request found. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    globalOtpMap.delete(phone);
    return { valid: false, error: 'OTP has expired. Please request a new code.' };
  }

  if (record.attempts >= 5) {
    globalOtpMap.delete(phone);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const expectedHash = hashOtp(phone, inputOtp);
  if (record.hash !== expectedHash) {
    record.attempts += 1;
    return { valid: false, error: `Invalid verification code. (${5 - record.attempts} attempts remaining)` };
  }

  // Valid: delete to prevent replay
  globalOtpMap.delete(phone);
  return { valid: true };
}
