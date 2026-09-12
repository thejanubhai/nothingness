import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        isLoggedIn: false,
        activeStay: null,
        activeGathering: null,
        unreadCount: 0,
      });
    }

    const adminClient = createAdminClient();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch Profile & Verification Details
    const { data: kp } = await adminClient
      .from('kinkster_profiles')
      .select('alias, avatar_url, is_id_verified, is_in_person_vetted, in_person_vetted, face_id_vetted, is_activated')
      .eq('id', user.id)
      .maybeSingle();

    const isIdVerified = kp?.is_id_verified || false;
    const isLevel2Vetted = kp?.is_in_person_vetted || kp?.in_person_vetted || false;
    const alias = kp?.alias || user.email?.split('@')[0] || 'Member';

    // 2. Fetch Active Stay / Booking
    let activeStay = null;
    const { data: stays } = await adminClient
      .from('bookings')
      .select('id, space_id, check_in, check_out, status, id_verification_status')
      .or(`user_id.eq.${user.id},guest_email.eq.${user.email || 'none'}`)
      .in('status', ['confirmed', 'verified', 'checked_in'])
      .lte('check_in', tomorrow)
      .gte('check_out', todayStr)
      .order('check_in', { ascending: true })
      .limit(1);

    if (stays && stays.length > 0) {
      const b = stays[0];
      const isStayVerified = b.id_verification_status === 'verified' || isIdVerified;
      const checkInDate = new Date(b.check_in);
      const isTodayOrActive = now >= new Date(checkInDate.getTime() - 6 * 60 * 60 * 1000);

      // Fetch space door code & info
      const { data: space } = await adminClient
        .from('spaces')
        .select('title, slug, city, area, door_lock_code, key_instructions')
        .eq('id', b.space_id)
        .maybeSingle();

      activeStay = {
        id: b.id,
        spaceTitle: space?.title || 'Sanctuary Suite',
        spaceSlug: space?.slug || '',
        city: space?.city || 'Delhi NCR',
        area: space?.area || '',
        checkIn: b.check_in,
        checkOut: b.check_out,
        isTodayOrActive,
        isVerified: isStayVerified,
        doorPin: isStayVerified && space?.door_lock_code ? space.door_lock_code : null,
        needsVerification: !isStayVerified,
      };
    }

    // 3. Fetch Active Tonight Gathering / Sanctuary Pass
    let activeGathering = null;
    const { data: apps } = await adminClient
      .from('sanctuary_event_applications')
      .select('id, event_id, status, qr_secret_token')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .limit(3);

    if (apps && apps.length > 0) {
      for (const app of apps) {
        const { data: evt } = await adminClient
          .from('sanctuary_events')
          .select('id, title, event_date, spaces (title, city)')
          .eq('id', app.event_id)
          .gte('event_date', yesterday)
          .lte('event_date', nextDay)
          .maybeSingle();

        if (evt && evt.event_date) {
          const evtTime = new Date(evt.event_date).getTime();
          const diffMs = evtTime - now.getTime();
          // Active from 14 hours before to 14 hours after event time
          const isTonight = diffMs <= 14 * 60 * 60 * 1000 && diffMs > -14 * 60 * 60 * 1000;

          activeGathering = {
            id: evt.id,
            title: evt.title,
            eventDate: evt.event_date,
            isTonight,
            qrReady: true,
            qrToken: app.qr_secret_token,
            venue: (evt.spaces as any)?.title || 'Sanctuary Suite',
          };
          break;
        }
      }
    }

    // 4. Fetch Unread Whispers / Messages Count
    let unreadCount = 0;
    try {
      const { data: participants } = await adminClient
        .from('kinkster_conversation_participants')
        .select('unread_count, status')
        .eq('user_id', user.id)
        .eq('is_hidden', false);

      for (const p of participants || []) {
        if (p.status === 'active' || p.status === 'muted') {
          unreadCount += (p.unread_count || 0);
        } else if (p.status === 'pending_request') {
          unreadCount += 1;
        }
      }
    } catch (_) {}

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || '',
        alias,
        avatarUrl: kp?.avatar_url || null,
        isIdVerified,
        isLevel2Vetted,
        isFaceIdVetted: kp?.face_id_vetted || false,
        isAdmin: isUserAdmin(user),
      },
      activeStay,
      activeGathering,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Error fetching user active context:', err);
    return NextResponse.json({
      isLoggedIn: false,
      activeStay: null,
      activeGathering: null,
      unreadCount: 0,
      error: err.message,
    });
  }
}
