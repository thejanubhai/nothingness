import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPaymentWithPayUS2S } from '@/lib/payu';

export async function POST(req: Request) {
  try {
    const { token, orderId } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: guest, error: guestError } = await supabase
      .from('booking_guests')
      .select('id, payment_status, payment_order_id, payment_amount')
      .or(`verification_token.eq.${token},id.eq.${token}`)
      .limit(1)
      .maybeSingle();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest record not found' }, { status: 404 });
    }

    if (guest.payment_status === 'paid') {
      return NextResponse.json({ success: true, paid: true, message: 'Payment already confirmed' });
    }

    const targetOrderId = orderId || guest.payment_order_id;
    if (!targetOrderId) {
      return NextResponse.json({ error: 'No active order ID found for this guest' }, { status: 400 });
    }

    // Verify order status directly with PayU Server-to-Server API
    const payuRes = await verifyPaymentWithPayUS2S(targetOrderId);

    if (payuRes.success) {
      await supabase
        .from('booking_guests')
        .update({
          payment_status: 'paid',
          payment_id: targetOrderId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', guest.id);

      return NextResponse.json({
        success: true,
        paid: true,
        message: 'Payment confirmed successfully!',
      });
    } else {
      // If PayU explicitly marked as failed, record failure status
      if (payuRes.status === 'failed' || payuRes.status === 'failure') {
        await supabase
          .from('booking_guests')
          .update({
            payment_status: 'failed',
          })
          .eq('id', guest.id);
      }

      return NextResponse.json({
        success: false,
        paid: false,
        status: payuRes.status,
        message: payuRes.error || 'Payment has not been confirmed by the gateway yet.',
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify guest payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
