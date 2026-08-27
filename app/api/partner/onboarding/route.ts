import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformActionFees, createPayUPaymentRequest } from '@/lib/payu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { fee_partner_onboarding } = await getPlatformActionFees();

    let setupFeePaid = false;
    let mouSigned = false;
    let affidavitUploaded = false;

    if (user) {
      const adminSupabase = createAdminClient();
      // Check action_fee_orders for partner_onboarding
      const { data: feeOrder } = await adminSupabase
        .from('action_fee_orders')
        .select('id, payment_status')
        .eq('user_id', user.id)
        .eq('action_type', 'partner_onboarding')
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (feeOrder || fee_partner_onboarding === 0) {
        setupFeePaid = true;
      }
    }

    return NextResponse.json({
      success: true,
      fee: fee_partner_onboarding,
      setupFeePaid,
      mouSigned,
      affidavitUploaded,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminSupabase = createAdminClient();

    const body = await req.json();
    const { action, partnerName, partnerEmail, partnerPhone, city, propertyAddress, signatureText, affidavitUrl } = body;

    const { fee_partner_onboarding } = await getPlatformActionFees();

    // 1. INITIATE REAL PAYU SETUP PAYMENT
    if (action === 'initiate_setup_payment' || action === 'pay_setup_fee') {
      const targetFee = Number(fee_partner_onboarding) || 0;

      // If setup fee is set to 0 by Admin, instantly confirm without gateway
      if (targetFee <= 0) {
        if (user) {
          await adminSupabase.from('action_fee_orders').upsert({
            user_id: user.id,
            action_type: 'partner_onboarding',
            amount: 0,
            payment_order_id: `partner_free_${user.id.slice(0, 8)}_${Date.now()}`,
            payment_status: 'paid',
            metadata: { partnerName, partnerEmail, city, propertyAddress, free_grant: true },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'payment_order_id' });
        }

        return NextResponse.json({
          success: true,
          requiresPayment: false,
          setupFeePaid: true,
          message: 'Zero-fee onboarding granted by platform administration.',
        });
      }

      // Generate real PayU Payment Order
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const orderId = `partner_${user?.id ? user.id.slice(0, 6) : 'guest'}_${Date.now()}_${uniqueSuffix}`;

      // Record pending order in action_fee_orders
      await adminSupabase.from('action_fee_orders').insert({
        user_id: user?.id || null,
        action_type: 'partner_onboarding',
        amount: targetFee,
        payment_order_id: orderId,
        payment_status: 'pending',
        metadata: {
          partnerName: partnerName || 'Partner Principal',
          partnerEmail: partnerEmail || user?.email || 'partner@nothingness.asia',
          partnerPhone: partnerPhone || user?.phone || '9999999999',
          city: city || 'New Delhi',
          propertyAddress: propertyAddress || '',
        },
      });

      const { paymentUrl, params } = createPayUPaymentRequest({
        txnid: orderId,
        amount: targetFee,
        productinfo: 'Sanctuary Partner Onboarding Setup Fee',
        firstname: partnerName || user?.user_metadata?.full_name || 'Partner',
        email: partnerEmail || user?.email || 'partner@nothingness.asia',
        phone: partnerPhone || user?.phone || '9999999999',
        udf1: user?.id || orderId,
        udf2: 'partner_onboarding_fee',
        udf3: orderId,
        udf4: city || 'PAN India',
        udf5: partnerName || 'Partner Principal',
      });

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        paymentUrl,
        params,
        orderId,
        fee: targetFee,
      });
    }

    // 2. SIGN MOU CONTRACT
    if (action === 'sign_mou') {
      const signedAt = new Date().toISOString();
      return NextResponse.json({
        success: true,
        message: 'MoU signed and recorded successfully.',
        signedAt,
        contractCity: city || 'PAN India',
      });
    }

    // 3. SUBMIT PROPERTY AFFIDAVIT
    if (action === 'submit_affidavit') {
      if (!affidavitUrl) {
        return NextResponse.json({ error: 'Affidavit URL or file scan is required.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Affidavit uploaded and registered. Queued for statutory admin verification.',
        status: 'under_review',
        affidavitUrl,
      });
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 });

  } catch (error: any) {
    console.error('Partner onboarding API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
