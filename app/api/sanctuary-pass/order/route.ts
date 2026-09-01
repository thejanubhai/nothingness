import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayUPaymentRequest } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Check if ID is verified
    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('is_verified, full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!guestProfile?.is_verified) {
      return NextResponse.json(
        { error: 'Govt ID verification required before acquiring a Sanctuary Pass.' },
        { status: 403 }
      );
    }

    // Check if pass is already active
    const { data: existingPass } = await adminClient
      .from('sanctuary_passes')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPass && existingPass.status === 'active') {
      return NextResponse.json(
        { error: 'You already hold an active Lifetime Sanctuary Pass.' },
        { status: 400 }
      );
    }

    // Fetch dynamic pass price from settings
    const { data: settings } = await adminClient
      .from('sanctuary_pass_settings')
      .select('one_time_pass_price')
      .maybeSingle();

    const passPrice = settings?.one_time_pass_price || 1499;
    const txnid = `spass_${Date.now()}_${user.id.slice(0, 4)}`;

    const isSyntheticEmail = Boolean(user.email && user.email.includes('@auth.nothingness'));
    const rawPhone = user.phone
      ? user.phone.replace(/[^0-9]/g, '')
      : guestProfile.phone
      ? guestProfile.phone.replace(/[^0-9]/g, '')
      : '9999999999';
    const customerPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';
    const customerName = guestProfile.full_name || user.user_metadata?.full_name || 'Sanctuary Member';
    const customerEmail = isSyntheticEmail ? 'membership@nothingness.asia' : user.email || 'membership@nothingness.asia';

    const { paymentUrl, params } = createPayUPaymentRequest({
      txnid,
      amount: passPrice,
      productinfo: 'Nothingness Sanctuary Lifestyle Access Pass',
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      udf1: user.id,
      udf2: 'sanctuary_pass_fee',
      udf3: String(passPrice),
      udf4: customerName,
    });

    return NextResponse.json({
      success: true,
      orderId: txnid,
      amount: passPrice,
      paymentUrl,
      params,
    });
  } catch (err: any) {
    console.error('Sanctuary Pass Order Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
