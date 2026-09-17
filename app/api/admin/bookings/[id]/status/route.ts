import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPrimaryBookingConfirmationNotification } from '@/lib/notifications/verification';
import { sendWhatsAppMessage } from '@/lib/omnichannel/meta';
import { logAdminAction } from '@/lib/audit-logger';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, payment_status } = await req.json();
    const supabase = await createClient();

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (payment_status) updatePayload.payment_status = payment_status;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select('*, spaces(title, cleaner_phone, cleaner_name)')
      .single();

    if (error) throw error;

    const spaceTitle = (booking.spaces as any)?.title || 'Private Sanctuary';

    // 1. If status changed to confirmed, notify guest via Email (tax invoice) & WhatsApp
    if (status === 'confirmed') {
      if (booking.guest_email) {
        try {
          await sendPrimaryBookingConfirmationNotification({
            email: booking.guest_email,
            guestName: booking.guest_name || 'Sanctuary Guest',
            bookingId: booking.id,
            spaceTitle,
            checkInDate: booking.check_in,
            checkOutDate: booking.check_out,
            totalAmount: booking.total_price || 0,
            paymentMethod: booking.payment_method || 'Admin Direct Confirmation',
          });
        } catch (emailErr) {
          console.warn('[Admin Booking Status] Failed to dispatch confirmation email:', emailErr);
        }
      }

      if (booking.guest_phone) {
        try {
          const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
          const checkinUrl = `${siteUrl}/verify-guest/invite?booking=${booking.id}`;
          const waMsg = `Namaste ${booking.guest_name || 'Guest'}! ✨\n\nYour reservation at Nothingness (*${spaceTitle}*) is now confirmed.\n\n📅 Stay Dates: ${booking.check_in} to ${booking.check_out}\n\nPlease complete your 30-second digital ID check-in here:\n${checkinUrl}`;

          await sendWhatsAppMessage({
            to: booking.guest_phone,
            text: waMsg,
          });
        } catch (waErr) {
          console.warn('[Admin Booking Status] Failed to dispatch confirmation WhatsApp:', waErr);
        }
      }
    }

    // 2. If status changed to completed or checked_in, auto-create a housekeeping turnover task if none exists
    if (status === 'completed' || status === 'checked_in') {
      const { data: existingTask } = await supabase
        .from('housekeeping_tasks')
        .select('id')
        .eq('booking_id', id)
        .maybeSingle();

      if (!existingTask && booking.space_id) {
        await supabase
          .from('housekeeping_tasks')
          .insert({
            space_id: booking.space_id,
            booking_id: id,
            task_type: 'turnover',
            scheduled_date: booking.check_out,
            status: 'pending',
            assigned_to: (booking.spaces as any)?.cleaner_name || 'Housekeeping Team',
            description: `Auto-scheduled check-out turnover for ${spaceTitle}.`
          });
      }
    }

    // 3. Log audit event
    await logAdminAction(
      `booking_${status || 'updated'}`,
      'booking',
      id,
      { status, payment_status, guest_name: booking.guest_name }
    );

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
