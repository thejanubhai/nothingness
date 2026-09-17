import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { format } from 'date-fns';
import { sendWhatsAppMessage } from '@/lib/omnichannel/meta';
import { logAdminAction } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Fetch today's checkouts from bookings
    const { data: checkouts, error: checkoutErr } = await adminSupabase
      .from('bookings')
      .select(`
        id,
        check_in,
        check_out,
        guests,
        spaces (
          id,
          title,
          check_in_time,
          check_out_time,
          cleaner_name,
          cleaner_phone
        )
      `)
      .or('status.eq.confirmed,status.eq.completed');

    if (checkoutErr) {
      console.error('[Housekeeping Dispatch] Error fetching checkouts:', checkoutErr);
      return NextResponse.json({ success: false, error: checkoutErr.message }, { status: 500 });
    }

    let dispatchedCount = 0;
    const taskDetails: any[] = [];

    if (checkouts && checkouts.length > 0) {
      for (const booking of checkouts) {
        const checkoutDateStr = format(new Date(booking.check_out), 'yyyy-MM-dd');
        if (checkoutDateStr !== todayStr) continue;

        const space: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
        if (!space) continue;

        const cleanerName = space.cleaner_name || 'Housekeeping Staff';
        const cleanerPhone = space.cleaner_phone;
        const checkoutTime = space.check_out_time || '11:00 AM';
        const nextCheckInTime = space.check_in_time || '3:00 PM';

        // 2. Upsert housekeeping turnover task into Supabase
        const { data: task, error: taskErr } = await adminSupabase
          .from('housekeeping_tasks')
          .upsert(
            {
              space_id: space.id,
              booking_id: booking.id,
              scheduled_date: todayStr,
              task_type: 'turnover',
              assigned_to: cleanerName,
              status: 'pending',
              description: `Turnover cleaning for ${space.title}. Guest checkout: ${checkoutTime}. Next arrival: ${nextCheckInTime}.`,
            },
            { onConflict: 'space_id,scheduled_date' }
          )
          .select()
          .single();

        if (taskErr) {
          console.error('[Housekeeping Dispatch] Task upsert error:', taskErr);
        }

        // 3. Dispatch Live WhatsApp message via Meta Cloud API if cleaner phone exists
        let waResult: any = null;
        if (cleanerPhone) {
          const messageText = `Namaste ${cleanerName}! 🧹\n\nHousekeeping turnover alert for *${space.title}* on ${todayStr}.\n\n- Guest Checkout: ${checkoutTime}\n- Next Check-In: ${nextCheckInTime}\n\nPlease inspect the suite, replace linens, and ensure optical cleanliness validation upon completion.`;
          
          waResult = await sendWhatsAppMessage({
            to: cleanerPhone,
            text: messageText,
          });

          if (waResult.success) {
            dispatchedCount++;
          }
        }

        taskDetails.push({
          taskId: task?.id,
          spaceTitle: space.title,
          cleanerName,
          cleanerPhone: cleanerPhone || 'Not assigned',
          whatsappDispatched: Boolean(waResult?.success),
          mocked: Boolean(waResult?.mocked),
        });
      }
    }

    // 4. Record action in audit log
    await logAdminAction(
      'housekeeping_dispatched',
      'housekeeping',
      null,
      { today: todayStr, dispatchedCount, totalTasks: taskDetails.length }
    );

    return NextResponse.json({
      success: true,
      today: todayStr,
      dispatchedCount,
      tasks: taskDetails,
    });
  } catch (err: any) {
    console.error('[Admin Housekeeping Dispatch Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
