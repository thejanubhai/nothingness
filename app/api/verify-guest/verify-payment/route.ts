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
      .select('id, payment_status, payment_order_id')
      .or(`verification_token.eq.${token},id.eq.${token}`)
      .limit(1)
      .maybeSingle();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest record not found' }, { status: 404 });
    }

    if (guest.payment_status === 'paid') {
      return NextResponse.json({ success: true, paid: true, message: 'Payment already recorded' });
    }

    const targetOrderId = orderId || guest.payment_order_id;
    if (!targetOrderId) {
      return NextResponse.json({ error: 'Order ID not found' }, { status: 400 });
    }

    // Verify order status with PayU S2S API
    let isSuccess = false;
    try {
      const payuRes = await verifyPaymentWithPayUS2S(targetOrderId);
      isSuccess = payuRes.success;
    } catch (payuErr) {
      console.warn('PayU payment fetch check warning:', payuErr);
      isSuccess = true;
    }

    if (isSuccess) {
      await supabase
        .from('booking_guests')
        .update({
          payment_status: 'paid',
          payment_id: targetOrderId,
          paid_at: new Date().toISOString()
        })
        .eq('id', guest.id);

      return NextResponse.json({
        success: true,
        paid: true,
        message: 'Payment completed successfully!'
      });
    } else {
      return NextResponse.json({
        success: false,
        paid: false,
        message: 'Payment has not been completed yet.'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify guest payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
