import { createAdminClient } from '@/lib/supabase/admin';

let cachedGeminiKey: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Cache for 1 minute

/**
 * Resolves the Gemini API Key from environment variables or Supabase platform_settings.
 * Prioritizes environment variables, then falls back to platform_settings.
 */
export async function getGeminiApiKey(): Promise<string | null> {
  const envKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  const now = Date.now();
  if (cachedGeminiKey && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedGeminiKey;
  }

  try {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('platform_settings')
      .select('gemini_api_key')
      .limit(1)
      .maybeSingle();

    if (settings?.gemini_api_key && settings.gemini_api_key.trim()) {
      cachedGeminiKey = settings.gemini_api_key.trim();
      lastFetchTime = now;
      return cachedGeminiKey;
    }
  } catch (err: any) {
    console.warn('[Gemini Client] Could not resolve key from platform_settings:', err?.message || err);
  }

  return null;
}
