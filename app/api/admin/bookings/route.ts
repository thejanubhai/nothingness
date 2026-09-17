import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { recordScoutError, traceSpan } from '@/lib/monitoring/scout';
import { sendPrimaryBookingConfirmationNotification } from '@/lib/notifications/verification';
import { sendWhatsAppMessage } from '@/lib/omnichannel/meta';
import { logAdminAction } from '@/lib/audit-logger';
import { env } from '@/lib/env';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      space_id,
      check_in,
      check_out,
      guest_name,
      guest_phone,
      guest_email,
      total_price = 0,
      payment_method = 'UPI',
      payment_status = 'paid',
      status = 'confirmed',
      guests = 2
    } = body;

    if (!space_id || !check_in || !checkOutValidation(check_in, check_out)) {
      return NextResponse.json({ success: false, error: 'Invalid dates or sanctuary space.' }, { status: 400 });
    }

    if (!guest_name || !guest_phone) {
      return NextResponse.json({ success: false, error: 'Guest name and phone number are required.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const bookingResult = await traceSpan('AdminBooking', 'create_manual_reservation', async () => {
      // 1. Insert new booking using service role admin client (bypasses RLS)
      const { data: booking, error: bookingErr } = await adminClient
        .from('bookings')
        .insert({
          space_id,
          check_in,
          check_out,
          guest_name: String(guest_name).trim(),
          guest_phone: String(guest_phone).trim(),
          guest_email: guest_email ? String(guest_email).trim() : null,
          total_price: Number(total_price) || 0,
          payment_method,
          payment_status,
          status,
          booking_status: status,
          guests: Number(guests) || 2,
        })
        .select(`
          id, space_id, check_in, check_out, status, payment_status, payment_method, total_price, guests,
          guest_name, guest_phone, guest_email, created_at,
          spaces (id, title, slug, cleaner_name)
        `)
        .single();

      if (bookingErr) throw bookingErr;
      if (!booking) throw new Error('Failed to create booking.');

      // 2. Add Primary Guest entry to booking_guests
      const primaryGuestToken = crypto.randomUUID();
      const { error: guestErr } = await adminClient
        .from('booking_guests')
        .insert({
          booking_id: booking.id,
          guest_index: 0,
          name: String(guest_name).trim(),
          phone: String(guest_phone).trim(),
          email: guest_email ? String(guest_email).trim() : null,
          is_primary: true,
          verification_status: 'pending',
          verification_token: primaryGuestToken,
          payment_status: payment_status === 'paid' || payment_status === 'completed' ? 'not_required' : 'pending'
        });

      if (guestErr) {
        console.warn('[Admin Booking] Primary guest insert warning:', guestErr.message);
      }

      // 3. Auto-schedule Housekeeping Turnover Task
      try {
        await adminClient
          .from('housekeeping_tasks')
          .insert({
            space_id: booking.space_id,
            booking_id: booking.id,
            task_type: 'turnover',
            scheduled_date: booking.check_out,
            status: 'pending',
            assigned_to: (booking.spaces as any)?.cleaner_name || 'Housekeeping Team',
            description: `Manual Quick Reservation turnover for ${(booking.spaces as any)?.title || 'Sanctuary'}.`
          });
      } catch (taskErr: any) {
        console.warn('[Admin Booking] Housekeeping task auto-schedule warning:', taskErr.message);
      }

      return booking;
    }, { spaceId: space_id });

    const spaceTitle = (bookingResult.spaces as any)?.title || 'Private Sanctuary';

    // 4. Dispatch Email and WhatsApp confirmations if status is confirmed
    if (bookingResult.status === 'confirmed') {
      if (bookingResult.guest_email) {
        try {
          await sendPrimaryBookingConfirmationNotification({
            email: bookingResult.guest_email,
            guestName: bookingResult.guest_name || 'Sanctuary Guest',
            bookingId: bookingResult.id,
            spaceTitle,
            checkInDate: bookingResult.check_in,
            checkOutDate: bookingResult.check_out,
            totalAmount: bookingResult.total_price || 0,
            paymentMethod: bookingResult.payment_method || 'Admin Direct Confirmation',
          });
        } catch (emailErr) {
          console.warn('[Admin Booking] Email dispatch warning:', emailErr);
        }
      }

      if (bookingResult.guest_phone) {
        try {
          const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
          const checkinUrl = `${siteUrl}/verify-guest/invite?booking=${bookingResult.id}`;
          const waMsg = `Namaste ${bookingResult.guest_name || 'Guest'}! ✨\n\nYour reservation at Nothingness (*${spaceTitle}*) has been confirmed by our Concierge!\n\n📅 Stay Dates: ${bookingResult.check_in} to ${bookingResult.check_out}\n\nPlease complete your 30-second digital ID check-in here:\n${checkinUrl}`;

          await sendWhatsAppMessage({
            to: bookingResult.guest_phone,
            text: waMsg,
          });
        } catch (waErr) {
          console.warn('[Admin Booking] WhatsApp dispatch warning:', waErr);
        }
      }
    }

    // 5. Log audit trail
    await logAdminAction(
      'create_manual_reservation',
      'booking',
      bookingResult.id,
      { guest_name, space_id, check_in, check_out, total_price }
    );

    return NextResponse.json({
      success: true,
      booking: bookingResult,
      message: `Reservation confirmed for ${guest_name}!`
    });
  } catch (err: any) {
    console.error('[Admin Booking Create Error]:', err);
    recordScoutError(err, { endpoint: '/api/admin/bookings' });
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

function checkOutValidation(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  return new Date(checkOut).getTime() >= new Date(checkIn).getTime();
}
