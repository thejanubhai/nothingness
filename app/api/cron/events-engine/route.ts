import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recycleExpiredOffers } from '@/lib/events/ratio-balancer';
import { sendPushNotificationToUser } from '@/lib/webpush';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const now = new Date();
    const logs: string[] = [];

    // 1. Recycle expired unpaid waitlist offers
    const recycleResult = await recycleExpiredOffers();
    logs.push(`Recycled ${recycleResult.recycledCount} expired offers across ${recycleResult.affectedEvents?.length || 0} events.`);

    // 2. Secret Coordinates Dispatch (T-3 Hours)
    // Find published/in_progress events happening in the next 4 hours
    const nextFourHours = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const { data: upcomingEvents } = await adminClient
      .from('sanctuary_events')
      .select('id, title, event_date, secret_location_address, location_revealed_hours_before')
      .in('status', ['published', 'in_progress'])
      .lte('event_date', nextFourHours)
      .gte('event_date', now.toISOString());

    if (upcomingEvents && upcomingEvents.length > 0) {
      for (const ev of upcomingEvents) {
        const evTime = new Date(ev.event_date).getTime();
        const diffHours = (evTime - now.getTime()) / (1000 * 60 * 60);
        const threshold = ev.location_revealed_hours_before || 3;

        if (diffHours <= threshold && diffHours >= 0) {
          // Fetch confirmed attendees
          const { data: confirmedApps } = await adminClient
            .from('sanctuary_event_applications')
            .select('user_id')
            .eq('event_id', ev.id)
            .eq('status', 'confirmed');

          if (confirmedApps && confirmedApps.length > 0) {
            for (const app of confirmedApps) {
              await sendPushNotificationToUser(app.user_id, {
                title: '📍 Secret Venue Coordinates Unlocked',
                body: `Coordinates for "${ev.title}" are now active on your screen. Tap to view discreet map pin.`,
                url: `/sanctuary-pass?eventId=${ev.id}`,
                tag: `coord-unlocked-${ev.id}`,
              }).catch(console.error);
            }
            logs.push(`Dispatched secret coordinates push to ${confirmedApps.length} attendees for "${ev.title}".`);
          }
        }
      }
    }

    // 3. Auto-complete past events (event_date + 12 hours < now)
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const { data: pastEvents } = await adminClient
      .from('sanctuary_events')
      .update({ status: 'completed' })
      .eq('status', 'published')
      .lt('event_date', twelveHoursAgo)
      .select('id');

    if (pastEvents && pastEvents.length > 0) {
      logs.push(`Marked ${pastEvents.length} past events as completed.`);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      logs,
    });
  } catch (err: any) {
    console.error('Events engine cron error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
