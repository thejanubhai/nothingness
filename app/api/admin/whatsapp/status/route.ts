import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

async function checkWhatsAppConnection() {
  const startTime = performance.now();

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

  const wabaId =
    env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    process.env.whatsapp_business_account_id ||
    process.env.whatsappBusinessAccountId;

  if (!phoneNumberId) {
    return {
      connected: false,
      configured: false,
      phoneNumberId: null,
      wabaId: null,
      verifiedName: null,
      displayPhoneNumber: null,
      qualityRating: null,
      codeVerificationStatus: null,
      error: 'WHATSAPP_PHONE_NUMBER_ID is not configured in environment variables.',
      latency: 0,
    };
  }

  if (!accessToken) {
    return {
      connected: false,
      configured: true,
      phoneNumberId,
      wabaId: wabaId || null,
      verifiedName: null,
      displayPhoneNumber: null,
      qualityRating: null,
      codeVerificationStatus: null,
      error: 'WHATSAPP_ACCESS_TOKEN is missing to authenticate with Meta.',
      latency: Math.round(performance.now() - startTime),
    };
  }

  try {
    const metaUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}?access_token=${encodeURIComponent(accessToken)}&fields=id,verified_name,display_phone_number,quality_rating,code_verification_status,status,platform_type`;
    const res = await fetch(metaUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        connected: false,
        configured: true,
        phoneNumberId,
        wabaId: wabaId || null,
        verifiedName: null,
        displayPhoneNumber: null,
        qualityRating: null,
        codeVerificationStatus: null,
        error: errData.error?.message || `Meta Graph API returned status ${res.status}`,
        latency,
      };
    }

    const data = await res.json();

    return {
      connected: true,
      configured: true,
      phoneNumberId: data.id || phoneNumberId,
      wabaId: wabaId || null,
      verifiedName: data.verified_name || 'Nothingness Stays',
      displayPhoneNumber: data.display_phone_number || null,
      qualityRating: data.quality_rating || 'GREEN',
      codeVerificationStatus: data.code_verification_status || 'VERIFIED',
      status: data.status || 'CONNECTED',
      latency,
      graphApiVersion: 'v21.0',
      verifiedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      connected: false,
      configured: true,
      phoneNumberId,
      wabaId: wabaId || null,
      verifiedName: null,
      displayPhoneNumber: null,
      qualityRating: null,
      codeVerificationStatus: null,
      error: err.message || 'Network error connecting to Meta Graph API for WhatsApp',
      latency,
    };
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const status = await checkWhatsAppConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const status = await checkWhatsAppConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
