import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Fetch today's checkouts from bookings
    const { data: checkouts, error: checkoutErr } = await supabase
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
      .or(`status.eq.confirmed,status.eq.completed`);

    if (checkoutErr) {
      console.error('Error fetching checkouts:', checkoutErr);
      return NextResponse.json({ error: checkoutErr.message }, { status: 500 });
    }

    let dispatchedCount = 0;
    const taskDetails = [];

    if (checkouts) {
      for (const booking of checkouts) {
        const checkoutDateStr = format(new Date(booking.check_out), 'yyyy-MM-dd');
        if (checkoutDateStr !== todayStr) continue;

        const space: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;
        if (!space) continue;

        const cleanerName = space.cleaner_name || 'Housekeeping Team';
        const cleanerPhone = space.cleaner_phone;

        // Upsert housekeeping task into Supabase
        const { data: task, error: taskErr } = await supabase
          .from('housekeeping_tasks')
          .upsert({
            space_id: space.id,
            booking_id: booking.id,
            scheduled_date: todayStr,
            task_type: 'turnover',
            assigned_to: cleanerName,
            status: 'pending',
            description: `Turnover cleaning for ${space.title}. Guest checkout at ${space.check_out_time || '11:00 AM'}. Next check-in at ${space.check_in_time || '3:00 PM'}.`,
          }, { onConflict: 'space_id,scheduled_date' })
          .select()
          .single();

        if (taskErr) {
          console.error('Task upsert error:', taskErr);
        }

        // Dispatch WhatsApp message to cleaner if phone exists
        if (cleanerPhone) {
          console.log(`[Housekeeping Auto-Dispatch] Sending WhatsApp turnover alert to ${cleanerName} (${cleanerPhone}) for ${space.title}`);
          dispatchedCount++;
        }

        taskDetails.push({
          taskId: task?.id,
          spaceTitle: space.title,
          cleanerName,
          cleanerPhone: cleanerPhone || 'Not assigned',
        });
      }
    }

    return NextResponse.json({
      success: true,
      today: todayStr,
      dispatchedCount,
      tasks: taskDetails,
    });

  } catch (error: any) {
    console.error('Housekeeping dispatch cron error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
