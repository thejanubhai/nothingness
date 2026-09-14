import crypto from 'crypto';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Validates Meta x-hub-signature-256 header using HMAC-SHA256.
 * When secret is provided, computes HMAC-SHA256 over raw payload and verifies with timing-safe comparison.
 * If secret is empty/undefined, returns true to allow unconfigured local dev/mock test environments.
 */
export function verifyMetaWebhookSignature({
  rawBody,
  signatureHeader,
  secret,
}: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  secret: string | (string | undefined)[] | undefined;
}): boolean {
  const secrets = Array.isArray(secret)
    ? secret.filter((s): s is string => Boolean(s && s.trim()))
    : secret && secret.trim()
    ? [secret.trim()]
    : [];

  if (secrets.length === 0) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const signature = parts[1];

  return secrets.some((sec) => {
    const expectedSignature = crypto
      .createHmac('sha256', sec)
      .update(rawBody, 'utf8')
      .digest('hex');

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  });
}

export interface SendWhatsAppParams {
  to: string;
  text: string;
}

export interface SendInstagramParams {
  to: string;
  text: string;
}

export interface DispatchOmnichannelParams {
  channel: 'whatsapp' | 'instagram' | 'email' | 'sms' | 'all';
  recipient: string; // phone, IG scoped id, or email
  text: string;
  bookingId?: string;
  guestProfileId?: string;
  senderName?: string;
}

/**
 * Normalizes phone numbers for WhatsApp Cloud API (E.164 without leading +)
 * Supports Indian numbers with or without country code, and handles trunk leading zeros.
 */
export function formatWhatsAppRecipient(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, '');
  // If Indian mobile number entered with trunk zero (11 digits starting with 0 followed by 6,7,8,9)
  if (cleaned.length === 11 && cleaned.startsWith('0') && /^[6-9]/.test(cleaned.slice(1))) {
    cleaned = `91${cleaned.slice(1)}`;
  } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('910') && /^[6-9]/.test(cleaned.slice(3))) {
    cleaned = `91${cleaned.slice(3)}`;
  }
  return cleaned;
}

/**
 * Dispatches an outbound WhatsApp message via Meta WhatsApp Cloud API.
 * Uses WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.
 */
export async function sendWhatsAppMessage({ to, text }: SendWhatsAppParams): Promise<{
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
}> {
  if (!to?.trim() || !text?.trim()) {
    return {
      success: false,
      error: 'Recipient phone ("to") and message "text" are required for WhatsApp dispatch.',
    };
  }

  const phoneNumberId =
    env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.whatsapp_phone_number_id ||
    process.env.whatsappPhoneNumberId;

  const accessToken =
    env.WHATSAPP_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.whatsapp_access_token ||
    process.env.whatsappAccessToken;

  const cleanRecipient = formatWhatsAppRecipient(to);

  if (!phoneNumberId || !accessToken) {
    console.warn(
      `[WhatsApp Meta API] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing in environment. Mocking message to ${cleanRecipient}: "${text.slice(0, 50)}..."`
    );
    return { success: true, mocked: true, messageId: `mock_wa_${Date.now()}` };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[WhatsApp Meta API] Error response:', data);
      return {
        success: false,
        error: data.error?.message || `Failed to dispatch WhatsApp message via Meta API (Status ${response.status})`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[WhatsApp Meta API] Network/Execution error:', err);
    return { success: false, error: err.message || 'WhatsApp dispatch network error' };
  }
}

// In-memory cache for app access token
let cachedAppToken: { token: string; expiresAt: number } | null = null;

export function resetInstagramTokenCache() {
  cachedAppToken = null;
}

/**
 * Resolves the valid Meta Graph API Access Token for Instagram Messaging.
 * 1. Checks INSTAGRAM_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN.
 * 2. If missing, dynamically requests App Access Token via OAuth client_credentials grant using
 *    Instagram_app_ID / INSTAGRAM_APP_ID and Instagram_app_secret / INSTAGRAM_APP_SECRET.
 */
export async function resolveInstagramAccessToken(): Promise<string | null> {
  const directToken =
    env.INSTAGRAM_ACCESS_TOKEN ||
    env.WHATSAPP_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN;

  if (directToken) {
    return directToken;
  }

  const appId =
    env.Instagram_app_ID ||
    env.INSTAGRAM_APP_ID ||
    process.env.Instagram_app_ID ||
    process.env.INSTAGRAM_APP_ID ||
    env.meta_App_ID ||
    env.META_APP_ID;

  const appSecret =
    env.Instagram_app_secret ||
    env.INSTAGRAM_APP_SECRET ||
    process.env.Instagram_app_secret ||
    process.env.INSTAGRAM_APP_SECRET ||
    env.meta_App_secret ||
    env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return null;
  }

  if (cachedAppToken && cachedAppToken.expiresAt > Date.now()) {
    return cachedAppToken.token;
  }

  try {
    const oauthUrl = `https://graph.facebook.com/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&grant_type=client_credentials`;
    const response = await fetch(oauthUrl, { method: 'GET' });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[Meta Graph API] Failed to resolve client_credentials access token:', errData);
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      const ttlMs = (data.expires_in ? Number(data.expires_in) : 3600) * 1000;
      cachedAppToken = {
        token: data.access_token,
        expiresAt: Date.now() + Math.max(ttlMs - 60000, 60000),
      };
      return data.access_token;
    }
  } catch (fetchErr) {
    console.error('[Meta Graph API] Dynamic OAuth token fetch network error:', fetchErr);
  }

  return null;
}

/**
 * Dispatches an outbound message via Meta Instagram Direct Messaging API in realtime.
 */
export async function sendInstagramMessage({ to, text }: SendInstagramParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!to?.trim() || !text?.trim()) {
    return {
      success: false,
      error: 'Recipient ID ("to") and message "text" are required for Instagram dispatch.',
    };
  }

  const accessToken = await resolveInstagramAccessToken();

  if (!accessToken) {
    const errMsg = '[Instagram Meta API] Missing Meta access token or Instagram App credentials (Instagram_app_ID & Instagram_app_secret). Realtime dispatch aborted.';
    console.error(errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }

  const accountId =
    env.INSTAGRAM_ACCOUNT_ID?.trim() ||
    process.env.INSTAGRAM_ACCOUNT_ID?.trim() ||
    'me';
  const url = `https://graph.facebook.com/v21.0/${accountId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: to },
        message: { text },
      }),
    });

    // Invalidate cached token immediately if Meta rejected with 401
    if (response.status === 401) {
      cachedAppToken = null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Instagram Meta API] Error response:', data);
      return {
        success: false,
        error: data.error?.message || `Failed to dispatch Instagram message via Meta API (Status ${response.status})`,
      };
    }

    const messageId = data.message_id || data.messages?.[0]?.id || `ig_msg_${Date.now()}`;
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[Instagram Meta API] Network error:', err);
    return { success: false, error: err.message || 'Instagram dispatch network error' };
  }
}

/**
 * Unified Omnichannel dispatcher.
 * Routes message to WhatsApp, Instagram, or Email, and records it in conversation history.
 */
export async function dispatchOmnichannelMessage({
  channel,
  recipient,
  text,
  bookingId,
  guestProfileId,
  senderName = 'Nothingness Concierge',
}: DispatchOmnichannelParams): Promise<{ success: boolean; channelDispatched: string; error?: string }> {
  const supabase = createAdminClient();

  // 1. Determine conversation ID if possible
  let conversationId: string | null = null;

  if (guestProfileId) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('guest_profile_id', guestProfileId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) conversationId = conv.id;
  }

  if (!conversationId && recipient) {
    // Check if conversation exists by subject or customer_id
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .or(`customer_id.eq.${recipient},subject.ilike.%${recipient.slice(-10)}%`)
      .limit(1)
      .maybeSingle();

    if (conv) conversationId = conv.id;
  }

  // Create conversation if none exists
  if (!conversationId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        guest_profile_id: guestProfileId || null,
        customer_id: recipient,
        channel: channel === 'all' ? 'whatsapp' : channel,
        subject: `Conversation with ${recipient}`,
        status: 'open',
      })
      .select()
      .maybeSingle();

    if (newConv) conversationId = newConv.id;
  }

  let dispatchResult: { success: boolean; error?: string } = { success: true };
  const effectiveChannel = channel === 'all' ? (recipient.includes('@') ? 'email' : 'whatsapp') : channel;

  if (effectiveChannel === 'whatsapp') {
    dispatchResult = await sendWhatsAppMessage({ to: recipient, text });
  } else if (effectiveChannel === 'instagram') {
    dispatchResult = await sendInstagramMessage({ to: recipient, text });
  } else if (effectiveChannel === 'email' && recipient.includes('@')) {
    if (env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Nothingness <hello@nothingness.asia>',
          to: recipient,
          subject: 'Message from Nothingness',
          text,
        });
      } catch (emailErr: any) {
        dispatchResult = { success: false, error: emailErr.message };
      }
    }
  }

  // Record outgoing message in conversation_messages
  if (conversationId) {
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      sender_name: senderName,
      channel: effectiveChannel,
      content: text,
      status: dispatchResult.success ? 'delivered' : 'failed',
    });

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  return {
    success: dispatchResult.success,
    channelDispatched: effectiveChannel,
    error: dispatchResult.error,
  };
}
