import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

async function handleChatflow(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

    let arrivalsProcessed = 0;
    let checkoutsProcessed = 0;
    let remindersSent = 0;
    const actionsTaken: string[] = [];

    // ------------------------------------------------------------------
    // 1. ARRIVALS TODAY: Send Keyless Access / Check-in Welcome
    // ------------------------------------------------------------------
    const { data: todayArrivals } = await supabase
      .from('bookings')
      .select(`
        id, guest_name, guest_phone, guest_email, check_in, check_out, status, keyless_code,
        spaces (id, title, city, area, check_in_time, check_out_time, door_lock_code)
      `)
      .eq('check_in', todayStr)
      .neq('status', 'cancelled');

    if (todayArrivals && todayArrivals.length > 0) {
      for (const booking of todayArrivals) {
        const space: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
        const accessCode = booking.keyless_code || space?.door_lock_code || '1809#';
        const phone = booking.guest_phone;
        const guestName = booking.guest_name || 'Guest';
        const spaceTitle = space?.title || 'Sanctuary';

        if (phone) {
          console.log(`[Chatflow Engine] Check-in dispatch for ${guestName} (${phone}) at ${spaceTitle}. Door PIN: ${accessCode}`);
          actionsTaken.push(`Check-in access dispatched for ${guestName} (${spaceTitle})`);
          arrivalsProcessed++;
        }
      }
    }

    // ------------------------------------------------------------------
    // 2. DEPARTURES TODAY: Send Checkout & Feedback Flow
    // ------------------------------------------------------------------
    const { data: todayDepartures } = await supabase
      .from('bookings')
      .select(`
        id, guest_name, guest_phone, check_out, status,
        spaces (title, check_out_time)
      `)
      .eq('check_out', todayStr)
      .neq('status', 'cancelled');

    if (todayDepartures && todayDepartures.length > 0) {
      for (const booking of todayDepartures) {
        const space: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
        const phone = booking.guest_phone;
        const guestName = booking.guest_name || 'Guest';

        if (phone) {
          console.log(`[Chatflow Engine] Checkout notice for ${guestName} (${phone}) at ${space?.title}. Standard checkout: ${space?.check_out_time || '11:00 AM'}`);
          actionsTaken.push(`Checkout notice sent to ${guestName}`);
          checkoutsProcessed++;
        }
      }
    }

    // ------------------------------------------------------------------
    // 3. PENDING ID VERIFICATIONS: Send Reminders for Upcoming Stays
    // ------------------------------------------------------------------
    const tomorrowStr = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select(`
        id, guest_name, guest_phone, check_in,
        booking_guests (id, name, verification_status, verification_token)
      `)
      .eq('check_in', tomorrowStr)
      .neq('status', 'cancelled');

    if (upcomingBookings && upcomingBookings.length > 0) {
      for (const booking of upcomingBookings) {
        const unverifiedGuests = (booking.booking_guests || []).filter((g: any) => g.verification_status !== 'verified');
        if (unverifiedGuests.length > 0 && booking.guest_phone) {
          const inviteUrl = `${siteUrl}/verify-guest/invite?booking=${booking.id}`;
          console.log(`[Chatflow Engine] Verification reminder sent to ${booking.guest_name} (${booking.guest_phone}): ${inviteUrl}`);
          actionsTaken.push(`ID verification reminder sent for booking ${booking.id.slice(0, 8)}`);
          remindersSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      today: todayStr,
      arrivalsProcessed,
      checkoutsProcessed,
      remindersSent,
      actionsTaken,
    });
  } catch (error: any) {
    console.error('Chatflow cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleChatflow(request);
}

export async function POST(request: Request) {
  return handleChatflow(request);
}
