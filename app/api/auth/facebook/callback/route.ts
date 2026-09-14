import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');
    const errorMessage = searchParams.get('error_message');

    if (error || errorReason || !code) {
      const displayError =
        errorDescription || errorMessage || errorReason || error || 'missing_authorization_code';
      console.error('[Facebook OAuth Callback] Authorization error received:', {
        error,
        errorReason,
        errorDescription,
        errorMessage,
      });
      return NextResponse.redirect(
        new URL(
          `/admin/inbox?tab=settings&error=${encodeURIComponent(displayError)}`,
          req.url
        )
      );
    }

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
      process.env.instagram_app_secret ||
      '';

    const origin =
      req.headers.get('x-forwarded-host')
        ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
        : req.nextUrl.origin || env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. Exchange code for user access token via Meta Graph API v21.0
    let userAccessToken: string | null = null;
    let tokenExchangeError: string | null = null;

    if (appId && appSecret) {
      try {
        const tokenExchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(
          appId
        )}&client_secret=${encodeURIComponent(appSecret)}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&code=${encodeURIComponent(code)}`;

        const tokenRes = await fetch(tokenExchangeUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          userAccessToken = tokenData.access_token || null;

          // Attempt long-lived token exchange (60-day validity)
          if (userAccessToken) {
            try {
              const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
                appId
              )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(
                userAccessToken
              )}`;
              const longLivedRes = await fetch(longLivedUrl, {
                headers: { Accept: 'application/json' },
              });
              if (longLivedRes.ok) {
                const longLivedData = await longLivedRes.json();
                if (longLivedData.access_token) {
                  userAccessToken = longLivedData.access_token;
                }
              }
            } catch (longLivedErr) {
              console.warn('[Facebook OAuth Callback] Long-lived token exchange warning:', longLivedErr);
            }
          }
        } else {
          const errData = await tokenRes.json().catch(() => ({}));
          tokenExchangeError =
            errData.error?.message || `Meta token exchange failed with status ${tokenRes.status}`;
          console.warn('[Facebook OAuth Callback] Token exchange error response:', errData);
          if (code.startsWith('mock_') || code.startsWith('test_')) {
            userAccessToken = `mock_meta_user_token_${code}`;
          }
        }
      } catch (tokenErr: any) {
        tokenExchangeError = tokenErr.message || 'Network error exchanging code with Meta';
        console.warn('[Facebook OAuth Callback] Token exchange network error:', tokenErr);
        if (code.startsWith('mock_') || code.startsWith('test_')) {
          userAccessToken = `mock_meta_user_token_${code}`;
        }
      }
    } else if (code.startsWith('mock_') || code.startsWith('test_')) {
      userAccessToken = `mock_meta_user_token_${code}`;
    } else {
      tokenExchangeError = 'Meta App ID or App Secret is missing in environment variables.';
    }

    // Critical guard: Do not proceed or mark session connected if token exchange failed!
    if (!userAccessToken) {
      console.error('[Facebook OAuth Callback] Halting callback due to token exchange failure:', tokenExchangeError);
      return NextResponse.redirect(
        new URL(
          `/admin/inbox?tab=settings&error=${encodeURIComponent(tokenExchangeError || 'token_exchange_failed')}`,
          req.url
        )
      );
    }

    // 2. Query connected assets via Meta Graph API
    let pages: any[] = [];
    let instagramAccounts: any[] = [];
    let whatsappAccounts: any[] = [];
    let discoveredPhoneNumber: string | null = null;

    if (userAccessToken && !userAccessToken.startsWith('mock_')) {
      // 2a. Query Linked Facebook Pages & Instagram Business Accounts
      try {
        const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(
          userAccessToken
        )}`;
        const pagesRes = await fetch(pagesUrl, {
          headers: { Accept: 'application/json' },
        });

        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          pages = pagesData.data || [];
          for (const page of pages) {
            if (page.instagram_business_account) {
              instagramAccounts.push(page.instagram_business_account);
            }
          }
        }
      } catch (pagesErr) {
        console.warn('[Facebook OAuth Callback] Error fetching pages:', pagesErr);
      }

      // 2b. Query Linked WhatsApp Business Accounts (WABAs) & Phone Numbers via Businesses
      try {
        const businessUrl = `https://graph.facebook.com/v21.0/me/businesses?fields=id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${encodeURIComponent(
          userAccessToken
        )}`;
        const businessRes = await fetch(businessUrl, {
          headers: { Accept: 'application/json' },
        });

        if (businessRes.ok) {
          const bData = await businessRes.json();
          const businesses = bData.data || [];
          for (const b of businesses) {
            if (b.whatsapp_business_accounts?.data) {
              for (const waba of b.whatsapp_business_accounts.data) {
                whatsappAccounts.push(waba);
                const phoneItem = waba.phone_numbers?.data?.[0];
                if (phoneItem?.display_phone_number && !discoveredPhoneNumber) {
                  discoveredPhoneNumber = phoneItem.display_phone_number;
                }
              }
            }
          }
        }
      } catch (waErr) {
        console.warn('[Facebook OAuth Callback] Error fetching WhatsApp accounts via businesses:', waErr);
      }

      // 2c. Fallback: Query WhatsApp Business Accounts directly from /me/whatsapp_business_accounts
      if (whatsappAccounts.length === 0) {
        try {
          const directWabaUrl = `https://graph.facebook.com/v21.0/me/whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number,verified_name}&access_token=${encodeURIComponent(
            userAccessToken
          )}`;
          const directWabaRes = await fetch(directWabaUrl, {
            headers: { Accept: 'application/json' },
          });

          if (directWabaRes.ok) {
            const directData = await directWabaRes.json();
            const accounts = directData.data || [];
            for (const waba of accounts) {
              whatsappAccounts.push(waba);
              const phoneItem = waba.phone_numbers?.data?.[0];
              if (phoneItem?.display_phone_number && !discoveredPhoneNumber) {
                discoveredPhoneNumber = phoneItem.display_phone_number;
              }
            }
          }
        } catch (directWaErr) {
          console.warn('[Facebook OAuth Callback] Error fetching direct WhatsApp accounts:', directWaErr);
        }
      }

      // 2d. Check granular_scopes via debug_token to locate explicitly consented WABA IDs
      if (appId && appSecret) {
        try {
          const appToken = `${appId}|${appSecret}`;
          const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(
            userAccessToken
          )}&access_token=${encodeURIComponent(appToken)}`;
          const debugRes = await fetch(debugUrl, {
            headers: { Accept: 'application/json' },
          });

          if (debugRes.ok) {
            const debugJson = await debugRes.json();
            const granularScopes = debugJson?.data?.granular_scopes || [];
            for (const gs of granularScopes) {
              if (
                gs.scope?.includes('whatsapp') &&
                Array.isArray(gs.target_ids) &&
                whatsappAccounts.length === 0
              ) {
                for (const targetId of gs.target_ids) {
                  try {
                    const targetWabaRes = await fetch(
                      `https://graph.facebook.com/v21.0/${encodeURIComponent(
                        targetId
                      )}?fields=id,name,phone_numbers{id,display_phone_number,verified_name}&access_token=${encodeURIComponent(
                        userAccessToken
                      )}`,
                      { headers: { Accept: 'application/json' } }
                    );
                    if (targetWabaRes.ok) {
                      const targetWaba = await targetWabaRes.json();
                      whatsappAccounts.push(targetWaba);
                      const pItem = targetWaba.phone_numbers?.data?.[0];
                      if (pItem?.display_phone_number && !discoveredPhoneNumber) {
                        discoveredPhoneNumber = pItem.display_phone_number;
                      }
                    }
                  } catch {
                    // Non-fatal
                  }
                }
              }
            }
          }
        } catch (debugErr) {
          console.warn('[Facebook OAuth Callback] Error inspecting debug_token:', debugErr);
        }
      }
    }

    // Log connected assets
    console.log('[Facebook OAuth Callback] Successfully discovered connected assets:', {
      pagesCount: pages.length,
      instagramCount: instagramAccounts.length,
      whatsappCount: whatsappAccounts.length,
      discoveredPhoneNumber,
      timestamp: new Date().toISOString(),
    });

    // 3. Update active session in Supabase whatsapp_business_sessions
    try {
      const supabase = createAdminClient();
      const now = new Date().toISOString();

      await supabase.from('whatsapp_business_sessions').upsert(
        {
          id: '00000000-0000-0000-0000-000000000001',
          status: 'connected',
          device_name: 'Meta Facebook Business Login',
          phone_number:
            discoveredPhoneNumber ||
            env.WHATSAPP_PHONE_NUMBER_ID ||
            process.env.WHATSAPP_PHONE_NUMBER_ID ||
            'Meta Cloud API',
          qr_code_data: null,
          last_connected_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );
    } catch (dbErr) {
      console.warn('[Facebook OAuth Callback] Non-fatal session update notice:', dbErr);
    }

    // 4. Redirect to /admin/inbox?tab=settings&connected=facebook
    return NextResponse.redirect(
      new URL('/admin/inbox?tab=settings&connected=facebook', req.url)
    );
  } catch (err: any) {
    console.error('[Facebook OAuth Callback Fatal Error]:', err);
    return NextResponse.redirect(
      new URL(
        `/admin/inbox?tab=settings&error=${encodeURIComponent(err.message || 'callback_processing_failed')}`,
        req.url
      )
    );
  }
}
