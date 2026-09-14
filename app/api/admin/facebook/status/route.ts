import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function checkFacebookConnection() {
  const startTime = performance.now();

  const configId =
    env.Facebook_login_Configuration_ID ||
    env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    env.facebook_login_configuration_id ||
    env.FACEBOOK_CONFIG_ID ||
    env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID ||
    process.env.Facebook_login_Configuration_ID ||
    process.env.FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.facebook_login_configuration_id ||
    process.env.FACEBOOK_CONFIG_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID;

  const appId =
    env.meta_App_ID ||
    env.META_APP_ID ||
    env.Instagram_app_ID ||
    env.INSTAGRAM_APP_ID ||
    env.instagram_app_id ||
    process.env.meta_App_ID ||
    process.env.META_APP_ID ||
    process.env.meta_app_id ||
    process.env.metaAppId ||
    process.env.Instagram_app_ID ||
    process.env.INSTAGRAM_APP_ID ||
    process.env.instagram_app_id;

  const appSecret =
    env.meta_App_secret ||
    env.META_APP_SECRET ||
    env.Instagram_app_secret ||
    env.INSTAGRAM_APP_SECRET ||
    env.instagram_app_secret ||
    process.env.meta_App_secret ||
    process.env.META_APP_SECRET ||
    process.env.meta_app_secret ||
    process.env.metaAppSecret ||
    process.env.Instagram_app_secret ||
    process.env.INSTAGRAM_APP_SECRET ||
    process.env.instagram_app_secret;

  const appName =
    env.Instagram_app_name ||
    env.INSTAGRAM_APP_NAME ||
    process.env.Instagram_app_name ||
    process.env.INSTAGRAM_APP_NAME ||
    'nothingness';

  const defaultProducts = [
    'WhatsApp Cloud API (Marketing Messages, Messaging, View Phone Assets)',
    'Conversions API for Business Messaging (Messenger, Instagram, WhatsApp)',
    'Instagram Direct Messaging',
    'Facebook Messenger',
  ];

  if (!configId) {
    return {
      connected: false,
      configured: false,
      configId: null,
      appId: appId || null,
      appName,
      products: defaultProducts,
      error: 'Facebook_login_Configuration_ID is not configured in environment variables.',
      latency: 0,
    };
  }

  if (!appId) {
    return {
      connected: false,
      configured: false,
      configId,
      appId: null,
      appName,
      products: defaultProducts,
      error: 'meta_App_ID is not configured in environment variables.',
      latency: 0,
    };
  }

  if (!appSecret) {
    return {
      connected: false,
      configured: true,
      configId,
      appId,
      appName,
      products: defaultProducts,
      error: 'meta_App_secret is missing to authenticate with Meta Graph API.',
      latency: Math.round(performance.now() - startTime),
    };
  }

  try {
    const appToken = `${appId}|${appSecret}`;
    const metaUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(appId)}?access_token=${encodeURIComponent(
      appToken
    )}&fields=id,name,category,link`;

    const res = await fetch(metaUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        connected: false,
        configured: true,
        configId,
        appId,
        appName,
        products: defaultProducts,
        error: errData.error?.message || `Meta Graph API returned status ${res.status}`,
        latency,
      };
    }

    const data = await res.json();

    // Check config_id health via Meta Graph API if accessible
    let configVerified = false;
    try {
      const configInspectionUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(configId)}?access_token=${encodeURIComponent(
        appToken
      )}&fields=id,name`;
      const configRes = await fetch(configInspectionUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (configRes.ok) {
        configVerified = true;
      }
    } catch {
      // Non-fatal if config object inspection requires specific permissions
    }

    return {
      connected: true,
      configured: true,
      configId,
      configVerified,
      appId: data.id || appId,
      appName: data.name || appName,
      products: defaultProducts,
      latency,
      graphApiVersion: 'v21.0',
      verifiedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      connected: false,
      configured: true,
      configId,
      appId,
      appName,
      products: defaultProducts,
      error: err.message || 'Network error connecting to Meta Graph API for Facebook Login',
      latency,
    };
  }
}

export async function GET(req?: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const status = await checkFacebookConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req?: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const status = await checkFacebookConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
