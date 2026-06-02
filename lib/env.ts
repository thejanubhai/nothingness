import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  CASHFREE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CASHFREE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_CASHFREE_ENVIRONMENT: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  RESEND_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_AUTH_WEBHOOK_SECRET: z.string().default('secret-auth-hook-token-123'),
  ADMIN: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
  NEXT_PUBLIC_CASHFREE_APP_ID: process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
  NEXT_PUBLIC_CASHFREE_ENVIRONMENT: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_AUTH_WEBHOOK_SECRET: process.env.SUPABASE_AUTH_WEBHOOK_SECRET,
  ADMIN: process.env.ADMIN,
});
