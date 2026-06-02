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
      
      // Idempotency check: see if already paid
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('payment_status')
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

      // Booking confirmation email is now handled by the database trigger
      // in /api/webhooks/bookings/route.ts which listens to status changes.
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
