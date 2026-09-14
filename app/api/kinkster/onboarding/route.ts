import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformActionFees, createPayUPaymentRequestAsync } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { alias, bio, avatar_url, kinks, onboarding_answers, confidentiality_agreed } = await req.json();

    if (!confidentiality_agreed) {
      return NextResponse.json(
        { error: 'You must accept the Confidentiality & Mutual Privacy Agreement.' },
        { status: 400 }
      );
    }

    if (!alias || alias.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please choose a valid unique alias (at least 3 characters).' },
        { status: 400 }
      );
    }

    const formattedAlias = alias.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const adminSupabase = createAdminClient();

    // 1. Check ID verification status in guest_profiles
    let isIdVerified = false;
    const cleanPhone = user.phone ? user.phone.replace(/[^0-9+]/g, '') : null;

    if (cleanPhone) {
      const { data: gpByPhone } = await adminSupabase
        .from('guest_profiles')
        .select('is_verified')
        .eq('phone', cleanPhone)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByPhone?.is_verified) isIdVerified = true;
    }

    if (!isIdVerified) {
      const { data: gpByUserId } = await adminSupabase
        .from('guest_profiles')
        .select('is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByUserId?.is_verified) isIdVerified = true;
    }

    if (!isIdVerified) {
      return NextResponse.json(
        { error: 'ID Verification Required. Please upload Aadhaar or Passport before activating Kinkster Mode.' },
        { status: 403 }
      );
    }

    // 2. Check alias uniqueness
    const { data: existingAlias } = await adminSupabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', formattedAlias)
      .neq('id', user.id)
      .maybeSingle();

    if (existingAlias) {
      return NextResponse.json(
        { error: `The alias @${formattedAlias} is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // 4. Dynamic Action Pricing Check for Kinkster Activation
    const { fee_kinkster_activation } = await getPlatformActionFees();

    if (fee_kinkster_activation > 0) {
      // Check if user has already paid
      const { data: existingFeePaid } = await adminSupabase
        .from('action_fee_orders')
        .select('id')
        .eq('user_id', user.id)
        .in('action_type', ['kinkster_activation', 'circle_activation'])
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (!existingFeePaid) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 7);
        const orderId = `circle_${user.id.slice(0, 6)}_${Date.now()}_${uniqueSuffix}`;

        // Save pending order
        await adminSupabase.from('action_fee_orders').insert({
          user_id: user.id,
          action_type: 'circle_activation',
          amount: fee_kinkster_activation,
          payment_order_id: orderId,
          payment_status: 'pending',
          metadata: {
            alias: formattedAlias,
            bio: bio || '',
            avatar_url: avatar_url || '',
            kinks: kinks || [],
            onboarding_answers: onboarding_answers || {},
          },
        });

        const { paymentUrl, params } = await createPayUPaymentRequestAsync({
          txnid: orderId,
          amount: fee_kinkster_activation,
          productinfo: 'The Circle Society Annual Membership',
          firstname: user.user_metadata?.full_name || 'The Circle Member',
          email: user.email || 'concierge@nothingness.asia',
          phone: user.phone || '9999999999',
          udf1: user.id,
          udf2: 'circle_activation_fee',
          udf3: orderId,
          udf4: formattedAlias,
        });

        return NextResponse.json({
          success: true,
          requiresPayment: true,
          paymentUrl,
          params,
          orderId,
          fee: fee_kinkster_activation,
        });
      }
    }

    // Extract tags from kinks array for quick display
    const interestTags = (kinks || []).map((k: any) => k.name || k.id);

    // 5. Upsert kinkster_profile
    const { data: profile, error: upsertError } = await adminSupabase
      .from('kinkster_profiles')
      .upsert({
        id: user.id,
        alias: formattedAlias,
        bio: bio || 'Passionate about luxury stays, aesthetics, and high discretion.',
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        is_activated: true,
        stay_verified: true,
        confidentiality_agreed: true,
        confidentiality_agreed_at: new Date().toISOString(),
        interests: interestTags,
        onboarding_answers: onboarding_answers || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 6. Save kink preferences with 1-5 star intensities into kinkster_preferences
    if (kinks && Array.isArray(kinks)) {
      for (const item of kinks) {
        if (item.id && item.intensity) {
          await adminSupabase
            .from('kinkster_preferences')
            .upsert({
              kinkster_id: user.id,
              kink_id: item.id,
              intensity: item.intensity
            }, { onConflict: 'kinkster_id,kink_id' });
        }
      }
    }

    return NextResponse.json({ success: true, requiresPayment: false, profile });
  } catch (err: any) {
    console.error('Onboarding exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
