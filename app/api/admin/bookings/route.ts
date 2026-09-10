import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { recordScoutError, traceSpan } from '@/lib/monitoring/scout';
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
