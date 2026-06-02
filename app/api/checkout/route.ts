import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';

const env = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;

const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

if (!appId || !secretKey) {
  console.warn("Cashfree API keys are missing. Payments will fail.");
}

const cashfree = new Cashfree(
  env, 
  appId || '', 
  secretKey || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { guests, spaceId, checkIn, checkOut, amount } = body;

    if (!spaceId || !checkIn || !checkOut || !amount || !guests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to book.' }, { status: 401 });
    }

    // Verify space exists and get actual price to prevent tampering
    const { data: space, error: propError } = await supabase
      .from('spaces')
      .select('nightly_price')
      .eq('id', spaceId)
      .single();

    if (propError || !space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    
    // Base price + 2500 cleaning + extra guests + 18% GST
    const baseTotal = (space.nightly_price * nights) + 2500;
    const extraGuestAmount = guests > 2 ? (guests - 2) * 500 * nights : 0;
    const finalAmount = Math.round((baseTotal + extraGuestAmount) * 1.18); // Including GST

    const orderId = `order_${Date.now()}`;

    // Save preliminary booking to Supabase FIRST to get the booking.id
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        space_id: spaceId,
        user_id: user.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        total_price: finalAmount,
        status: 'pending',
        payment_order_id: orderId
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking Error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 });
    }

    // Now create Cashfree Order with the correct return_url
    const request = {
      order_amount: finalAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `guest_${Date.now()}`,
        customer_phone: "9999999999",
        customer_name: "Nothingness Guest"
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/booking/${booking.id}/verify`
      }
    };
    const response = await cashfree.PGCreateOrder(request);
    const paymentSessionId = response.data.payment_session_id;

    // Create booking_guests entries
    const guestEntries = Array.from({ length: guests }).map((_, index) => ({
      booking_id: booking.id,
      guest_index: index,
      verification_status: 'pending'
    }));

    const { error: guestsError } = await supabase
      .from('booking_guests')
      .insert(guestEntries);

    if (guestsError) {
      console.error('Booking Guests Error:', guestsError);
      // Non-blocking error, but we should log it
    }

    return NextResponse.json({ 
      orderId: orderId, 
      paymentSessionId: paymentSessionId, 
      bookingId: booking.id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
