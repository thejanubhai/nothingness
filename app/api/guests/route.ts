import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const [guestsRes, bookingRes] = await Promise.all([
      supabase
        .from('booking_guests')
        .select('*')
        .eq('booking_id', bookingId)
        .order('guest_index', { ascending: true }),
      supabase
        .from('bookings')
        .select('id, status, payment_status, total_price, check_in, check_out, guest_name, guest_email, guest_phone, payment_order_id, spaces(title, city, check_in_time, check_out_time, key_instructions)')
        .eq('id', bookingId)
        .maybeSingle()
    ]);

    if (guestsRes.error) {
      return NextResponse.json({ error: guestsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      guests: guestsRes.data,
      booking: bookingRes.data,
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
