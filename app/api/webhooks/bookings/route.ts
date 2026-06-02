import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    // Verify it's coming from our Supabase database webhook
    if (authHeader !== `Bearer ${env.SUPABASE_AUTH_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Webhook payload from Supabase
    const record = payload.record;
    const old_record = payload.old_record;
    
    if (!record || !record.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Only proceed if this is a newly confirmed booking, or a booking that just changed to confirmed
    const isNewConfirmed = payload.type === 'INSERT' && record.status === 'confirmed';
    const isStatusChangedToConfirmed = payload.type === 'UPDATE' && 
                                       record.status === 'confirmed' && 
                                       old_record?.status !== 'confirmed';

    if (!isNewConfirmed && !isStatusChangedToConfirmed) {
      return NextResponse.json({ success: true, message: 'Ignored non-confirmation event' });
    }

    if (!env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY missing. Mocking booking confirmation for:', record.id);
      return NextResponse.json({ success: true, mocked: true });
    }

    const resend = new Resend(env.RESEND_API_KEY);
    const supabase = await createClient();

    // Fetch guest details
    const { data: profile } = await supabase
      .from('guest_profiles')
      .select('email, first_name')
      .eq('id', record.guest_id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ success: false, message: 'Guest has no email' });
    }

    // 1. Notify the Guest
    await resend.emails.send({
      from: 'Nothingness <bookings@nothingness.asia>',
      to: profile.email,
      subject: 'Your Booking at Nothingness is Confirmed!',
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: auto; text-align: center;">
          <h2>Booking Confirmed!</h2>
          <p>Hi ${profile.first_name || 'Guest'},</p>
          <p>Your booking for Space <strong>${record.space_id}</strong> is officially confirmed.</p>
          <p><strong>Check-in:</strong> ${record.check_in_date}</p>
          <p><strong>Check-out:</strong> ${record.check_out_date}</p>
          <p><strong>Total Paid:</strong> ₹${record.total_price}</p>
          <p>We look forward to hosting you!</p>
        </div>
      `
    });

    // 2. Notify the Admins (send to the owner's email)
    await resend.emails.send({
      from: 'Nothingness Alerts <alerts@nothingness.asia>',
      to: 'hello@nothingness.asia', // Admin email receiving the alerts
      subject: `NEW BOOKING: Space ${record.space_id}`,
      html: `
        <div style="font-family: sans-serif; max-w-md; margin: auto;">
          <h2>New Confirmed Booking Alert</h2>
          <p><strong>Booking ID:</strong> ${record.id}</p>
          <p><strong>Space:</strong> ${record.space_id}</p>
          <p><strong>Total Value:</strong> ₹${record.total_price}</p>
          <p>Please review the booking in the admin dashboard.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error processing booking webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
