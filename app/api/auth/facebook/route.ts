import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export interface GenerateFacebookOAuthUrlParams {
  appId: string;
  redirectUri: string;
  configId: string;
  state?: string;
}

/**
 * Constructs the Meta Facebook Login for Business OAuth dialog URL using config_id
 */
export function generateFacebookOAuthUrl({
  appId,
  redirectUri,
  configId,
  state = crypto.randomBytes(16).toString('hex'),
}: GenerateFacebookOAuthUrlParams): string {
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code&state=${state}`;
}

export async function GET(req: NextRequest) {
  try {
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
      process.env.instagram_app_id ||
      '';

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
      process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID ||
      '';

    const { searchParams } = new URL(req.url);
    const customRedirectUri = searchParams.get('redirect_uri');
    const customState = searchParams.get('state');
    const wantsJson =
      searchParams.get('format') === 'json' ||
      req.headers.get('accept')?.includes('application/json');

    if (!appId || !configId) {
      const errorMsg = 'Meta App ID or Facebook_login_Configuration_ID is missing in environment variables.';
      if (wantsJson) {
        return NextResponse.json({ error: errorMsg, configured: false }, { status: 400 });
      }
      return NextResponse.redirect(
        new URL('/admin/inbox?tab=settings&error=missing_facebook_config', req.url)
      );
    }

    const origin =
      req.headers.get('x-forwarded-host')
        ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
        : req.nextUrl.origin || env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

    const redirectUri = customRedirectUri || `${origin}/api/auth/facebook/callback`;
    const state = customState || crypto.randomBytes(16).toString('hex');

    const authUrl = generateFacebookOAuthUrl({
      appId,
      redirectUri,
      configId,
      state,
    });

    if (wantsJson) {
      return NextResponse.json({ url: authUrl, appId, configId, redirectUri, state });
    }

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('[Facebook OAuth Initiation Error]:', err);
    return NextResponse.redirect(
      new URL(`/admin/inbox?tab=settings&error=${encodeURIComponent(err.message || 'oauth_init_error')}`, req.url)
    );
  }
}
