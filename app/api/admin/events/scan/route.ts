import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeIdentifier } from '@/lib/auth-utils';
import { env } from '@/lib/env';

async function checkAdminAuth(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  const adminIdentifier = normalizeIdentifier(env.ADMIN || '');
  const userPhone = user?.phone ? normalizeIdentifier(user.phone) : null;

  if (!user || (userPhone !== adminIdentifier && !user.email?.includes('admin') && !user.email?.includes('hudav'))) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const { appId, token, action } = await req.json();

    if (!appId || !token) {
      return NextResponse.json({ error: 'Missing QR parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Look up application
    const { data: app, error } = await adminClient
      .from('sanctuary_event_applications')
      .select(`
        *,
        sanctuary_events (
          id,
          title,
          event_date
        )
      `)
      .eq('id', appId)
      .eq('qr_secret_token', token)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'Invalid or forged Entry QR code.' }, { status: 404 });
    }

    // Fetch Guest profile & ID status
    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('full_name, phone, is_verified')
      .eq('user_id', app.user_id)
      .maybeSingle();

    const { data: kinksterProfile } = await adminClient
      .from('kinkster_profiles')
      .select('alias, avatar_url')
      .eq('id', app.user_id)
      .maybeSingle();

    if (action === 'check_in') {
      if (app.status === 'checked_in') {
        return NextResponse.json({
          success: true,
          alreadyCheckedIn: true,
          checkedInAt: app.checked_in_at,
          app,
          guestProfile,
          kinksterProfile,
        });
      }

      const { data: updatedApp } = await adminClient
        .from('sanctuary_event_applications')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          checked_in_by: 'Admin Gatekeeper',
          updated_at: new Date().toISOString(),
        })
        .eq('id', app.id)
        .select()
        .single();

      return NextResponse.json({
        success: true,
        checkedIn: true,
        app: updatedApp,
        guestProfile,
        kinksterProfile,
      });
    }

    // Default: Return Verification Preview
    return NextResponse.json({
      success: true,
      valid: true,
      app,
      guestProfile,
      kinksterProfile,
      isConfirmed: app.status === 'confirmed',
      isCheckedIn: app.status === 'checked_in',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
