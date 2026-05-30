import { NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { createClient } from '@/lib/supabase/server';

const env = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
  ? CFEnvironment.PRODUCTION 
  : CFEnvironment.SANDBOX;

const cashfree = new Cashfree(
  env, 
  process.env.NEXT_PUBLIC_CASHFREE_APP_ID || 'dummy_id', 
  process.env.CASHFREE_SECRET_KEY || 'dummy_secret'
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
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('payment_order_id', orderId);

      if (error) {
        console.error('Webhook DB Error:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Trigger Knock booking-confirmation workflow
      if (process.env.KNOCK_SECRET_API_KEY) {
        try {
          const { Knock } = await import('@knocklabs/node');
          const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_API_KEY as string });
          
          const customerEmail = payload.data?.customer_details?.customer_email || 'guest@example.com';
          const customerName = payload.data?.customer_details?.customer_name || 'Nothingness Guest';
          const customerId = payload.data?.customer_details?.customer_id || 'guest_default';

          await knock.workflows.trigger('booking-confirmation', {
            recipients: [{
              id: customerId,
              email: customerEmail,
              name: customerName,
            }],
            data: {
              bookingId: orderId,
              status: 'confirmed'
            }
          });
          console.log("Knock booking-confirmation workflow triggered successfully.");
        } catch (knockErr) {
          console.error("Failed to trigger Knock workflow:", knockErr);
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
