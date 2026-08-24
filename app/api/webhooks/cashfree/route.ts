import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';

const env = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;

const appId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

if (!appId || !secretKey) {
  console.warn("Cashfree API keys are missing. Webhooks will fail.");
}

const cashfree = new Cashfree(
  env, 
  appId || '', 
  secretKey || ''
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
    }

    try {
      cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (err: any) {
      console.error("Cashfree Signature Verification Failed", err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data.order.order_id;

      const supabase = await createClient();
      
      // Check if this is an additional guest self-pay order
      if (orderId.startsWith('guest_pay_')) {
        await supabase
          .from('booking_guests')
          .update({
            payment_status: 'paid',
            payment_id: orderId,
            paid_at: new Date().toISOString()
          })
          .eq('payment_order_id', orderId);

        return NextResponse.json({ status: 'ok', message: 'Guest self-payment processed' }, { status: 200 });
      }

      // Main booking payment
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, payment_status, check_in, check_out, guest_name, spaces(title), booking_guests(id, name, phone, email, verification_token, is_primary, payment_status, payment_amount)')
        .eq('payment_order_id', orderId)
        .single();
        
      if (existingBooking?.payment_status === 'paid') {
        return NextResponse.json({ status: 'ok', message: 'Already processed' }, { status: 200 });
      }
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('payment_order_id', orderId);

      if (error) {
        console.error('Webhook DB Error:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Dispatch invitation & verification links to additional guests
      if (existingBooking?.booking_guests) {
        const { sendAdditionalGuestInviteNotification } = await import('@/lib/notifications/verification');
        const spaceRecord: any = Array.isArray(existingBooking.spaces) ? existingBooking.spaces[0] : existingBooking.spaces;

        for (const guest of existingBooking.booking_guests) {
          if (!guest.is_primary && (guest.phone || guest.email)) {
            sendAdditionalGuestInviteNotification({
              phone: guest.phone,
              email: guest.email,
              guestName: guest.name || 'Guest',
              spaceTitle: spaceRecord?.title || 'Sanctuary',
              primaryGuestName: existingBooking.guest_name || 'Primary Guest',
              checkInDate: existingBooking.check_in,
              checkOutDate: existingBooking.check_out,
              verificationToken: guest.verification_token,
              isSelfPay: guest.payment_status === 'pending',
              paymentAmount: guest.payment_amount,
            }).catch(console.error);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
