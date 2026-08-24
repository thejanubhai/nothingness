import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';

const env = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;

const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

const cashfree = new Cashfree(
  env, 
  appId || '', 
  secretKey || ''
);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch booking guest details by token
    const { data: guest, error: guestError } = await supabase
      .from('booking_guests')
      .select('id, name, phone, payment_status, payment_amount, booking_id, bookings(id, check_in, check_out, spaces(title))')
      .eq('verification_token', token)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest verification record not found' }, { status: 404 });
    }

    if (guest.payment_status === 'paid') {
      return NextResponse.json({ error: 'Payment has already been completed for this guest.' }, { status: 400 });
    }

    const paymentAmount = Number(guest.payment_amount) || 0;
    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'No payment is required for this guest.' }, { status: 400 });
    }

    const orderId = `guest_pay_${guest.id.slice(0, 8)}_${Date.now()}`;
    const cleanPhone = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : "9999999999";
    const customerPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : "9999999999";

    const request = {
      order_amount: paymentAmount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: guest.id,
        customer_phone: customerPhone,
        customer_name: guest.name || "Additional Guest"
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia'}/verify-guest/${token}?order_id=${orderId}`
      }
    };

    const response = await cashfree.PGCreateOrder(request);
    const paymentSessionId = response.data.payment_session_id;

    // Save order id to booking_guest record
    await supabase
      .from('booking_guests')
      .update({
        payment_order_id: orderId,
      })
      .eq('id', guest.id);

    return NextResponse.json({
      success: true,
      orderId,
      paymentSessionId,
      amount: paymentAmount,
    });

  } catch (error: any) {
    console.error('Guest Self-Pay Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate guest payment' }, { status: 500 });
  }
}
