import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // If status changed to completed or checked_in, auto-create a housekeeping turnover task if none exists
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
            description: `Auto-scheduled check-out turnover for ${(booking.spaces as any)?.title || 'Sanctuary'}.`
          });
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
