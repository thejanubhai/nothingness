import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth-utils';
import { broadcastPushNotification } from '@/lib/webpush';

async function checkAdminAuth(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return isUserAdmin(user);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const { action, settings, broadcast } = await req.json();
    const adminClient = createAdminClient();

    // 1. Update Settings
    if (action === 'update_settings' && settings) {
      const { data: updated, error } = await adminClient
        .from('sanctuary_pass_settings')
        .upsert(
          {
            one_time_pass_price: Number(settings.one_time_pass_price) || 1499,
            ai_vetting_enabled: settings.ai_vetting_enabled ?? true,
            default_ratio_couples: Number(settings.default_ratio_couples) || 60,
            default_ratio_females: Number(settings.default_ratio_females) || 25,
            default_ratio_males: Number(settings.default_ratio_males) || 15,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, settings: updated });
    }

    // 2. Emergency Broadcast Push
    if (action === 'broadcast_push' && broadcast) {
      const { title, body, targetGroup, eventId } = broadcast;

      let userIds: string[] = [];

      if (targetGroup === 'event_attendees' && eventId) {
        const { data: eventApps } = await adminClient
          .from('sanctuary_event_applications')
          .select('user_id')
          .eq('event_id', eventId)
          .in('status', ['confirmed', 'approved_payment_pending']);

        userIds = (eventApps || []).map((a) => a.user_id);
      } else if (targetGroup === 'all_passholders') {
        const { data: passes } = await adminClient
          .from('sanctuary_passes')
          .select('user_id')
          .eq('status', 'active');

        userIds = (passes || []).map((p) => p.user_id);
      } else {
        // All subscribed users
        const { data: subs } = await adminClient
          .from('web_push_subscriptions')
          .select('user_id');

        userIds = Array.from(new Set((subs || []).map((s) => s.user_id)));
      }

      const pushRes = await broadcastPushNotification(userIds, {
        title: title || 'Nothingness Sanctuary Alert',
        body: body || 'You have an important update regarding your Sanctuary Pass.',
        url: eventId ? `/sanctuary-pass?eventId=${eventId}` : '/sanctuary-pass',
      });

      return NextResponse.json({
        success: true,
        broadcastSentCount: pushRes.totalSent,
        targetUserCount: userIds.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
