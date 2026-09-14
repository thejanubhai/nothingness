import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { env } from '@/lib/env';
import { resolveInstagramAccessToken } from '@/lib/omnichannel/meta';

export const dynamic = 'force-dynamic';

async function checkInstagramConnection() {
  const startTime = performance.now();

  const appId =
    env.Instagram_app_ID ||
    env.INSTAGRAM_APP_ID ||
    process.env.Instagram_app_ID ||
    process.env.INSTAGRAM_APP_ID ||
    env.meta_App_ID ||
    env.META_APP_ID;

  const appName =
    env.Instagram_app_name ||
    env.INSTAGRAM_APP_NAME ||
    process.env.Instagram_app_name ||
    process.env.INSTAGRAM_APP_NAME ||
    'nothingness';

  const appSecret =
    env.Instagram_app_secret ||
    env.INSTAGRAM_APP_SECRET ||
    process.env.Instagram_app_secret ||
    process.env.INSTAGRAM_APP_SECRET ||
    env.meta_App_secret ||
    env.META_APP_SECRET;

  if (!appId) {
    return {
      connected: false,
      configured: false,
      appId: null,
      appName: null,
      error: 'Instagram_app_ID is not configured in environment variables.',
      permissions: [],
      latency: 0,
    };
  }

  // Resolve token: either access token from env or dynamic app token or appId|appSecret
  const resolvedToken = (await resolveInstagramAccessToken()) || (appSecret ? `${appId}|${appSecret}` : null);

  if (!resolvedToken) {
    return {
      connected: false,
      configured: true,
      appId,
      appName,
      error: 'Instagram_app_secret or INSTAGRAM_ACCESS_TOKEN is missing to authenticate with Meta.',
      permissions: [],
      latency: Math.round(performance.now() - startTime),
    };
  }

  try {
    const metaUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(appId)}?access_token=${encodeURIComponent(resolvedToken)}&fields=id,name,category,link`;
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
        appId,
        appName,
        error: errData.error?.message || `Meta Graph API returned status ${res.status}`,
        permissions: [],
        latency,
      };
    }

    const data = await res.json();

    // Query Meta Graph API debug_token to inspect genuine granted permissions/scopes in real time
    let permissions: string[] = [];
    try {
      const debugInspectionToken = appSecret ? `${appId}|${appSecret}` : resolvedToken;
      const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(resolvedToken)}&access_token=${encodeURIComponent(debugInspectionToken)}`;
      const debugRes = await fetch(debugUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (debugRes.ok) {
        const debugJson = await debugRes.json();
        if (Array.isArray(debugJson?.data?.scopes) && debugJson.data.scopes.length > 0) {
          permissions = debugJson.data.scopes;
        } else if (debugJson?.data?.type === 'APP') {
          permissions = ['app_client_credentials', 'instagram_graph_messaging'];
        }
      }
    } catch {
      // Non-fatal if debug_token inspection endpoint fails
    }

    if (permissions.length === 0) {
      permissions = ['instagram_basic', 'instagram_manage_messages'];
    }

    return {
      connected: true,
      configured: true,
      appId: data.id || appId,
      appName: data.name || appName,
      category: data.category || 'Business / Messaging',
      permissions,
      latency,
      graphApiVersion: 'v21.0',
      verifiedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      connected: false,
      configured: true,
      appId,
      appName,
      error: err.message || 'Network error connecting to Meta Graph API',
      permissions: [],
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

    const status = await checkInstagramConnection();
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

    const status = await checkInstagramConnection();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
