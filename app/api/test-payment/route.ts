import { NextRequest, NextResponse } from 'next/server';
import { createPayUPaymentRequestAsync, getPayUConfigAsync } from '@/lib/payu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getPayUConfigAsync();
    return NextResponse.json({
      env: config.env,
      isTestMode: config.env === 'TEST',
      endpoint: config.paymentUrl,
      keyPrefix: config.key ? `${config.key.slice(0, 4)}••••` : 'Not Configured',
      hasSalt: Boolean(config.salt),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = Number(body.amount) || 10;
    const amount = Math.max(1, Math.min(rawAmount, 10000)); // enforce safe range

    const name = (body.name || 'Nothingness Member').trim();
    const email = (body.email || 'concierge@nothingness.asia').trim();
    const rawPhone = (body.phone || '9910778576').replace(/[^0-9]/g, '');
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9910778576';

    const txnid = `testpay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const { paymentUrl, params } = await createPayUPaymentRequestAsync({
      txnid,
      amount,
      productinfo: 'Nothingness Gateway Activation Verification',
      firstname: name,
      email,
      phone,
      udf1: txnid,
      udf2: 'test_verification',
      udf3: String(amount),
      udf4: 'gateway_test',
    });

    const config = await getPayUConfigAsync();

    return NextResponse.json({
      success: true,
      orderId: txnid,
      amount,
      paymentUrl,
      params,
      mode: config.env,
    });
  } catch (err: any) {
    console.error('Test Payment Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initiate test payment' },
      { status: 500 }
    );
  }
}
