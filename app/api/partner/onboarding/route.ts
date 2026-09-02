import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformActionFees, createPayUPaymentRequestAsync } from '@/lib/payu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminSupabase = createAdminClient();

    const { fee_partner_onboarding } = await getPlatformActionFees();

    let setupFeePaid = false;
    let mouSigned = false;
    let affidavitUploaded = false;
    let status = 'pending_payment';
    let profileData: any = null;
    let properties: any[] = [];

    if (user) {
      // Check partner_profiles table
      const { data: profile } = await adminSupabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check action_fee_orders for partner_onboarding
      const { data: feeOrder } = await adminSupabase
        .from('action_fee_orders')
        .select('id, payment_status, payment_id')
        .eq('user_id', user.id)
        .eq('action_type', 'partner_onboarding')
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (profile) {
        profileData = profile;
        setupFeePaid = profile.setup_fee_paid || feeOrder?.payment_status === 'paid' || fee_partner_onboarding === 0;
        mouSigned = profile.contract_signed;
        affidavitUploaded = profile.affidavit_uploaded;
        status = profile.status;

        // Fetch partner properties
        const { data: props } = await adminSupabase
          .from('partner_properties')
          .select('*')
          .eq('partner_id', profile.id)
          .order('created_at', { ascending: false });

        properties = props || [];
      } else if (feeOrder || fee_partner_onboarding === 0) {
        setupFeePaid = true;
        status = 'contract_pending';
      }
    }

    return NextResponse.json({
      success: true,
      fee: fee_partner_onboarding ?? 300000,
      setupFeePaid,
      mouSigned,
      affidavitUploaded,
      status,
      profile: profileData,
      properties,
      user: user ? {
        id: user.id,
        email: user.email,
        phone: user.phone || (user.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : ''),
        fullName: user.user_metadata?.full_name || '',
      } : null,
    });
  } catch (err: any) {
    console.error('Partner onboarding GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminSupabase = createAdminClient();

    const body = await req.json();
    const { 
      action, 
      partnerName, 
      partnerEmail, 
      partnerPhone, 
      city, 
      state,
      locality,
      propertyAddress, 
      carpetArea,
      spaceTier,
      signatureText, 
      affidavitUrl,
      propertyTitle
    } = body;

    const { fee_partner_onboarding } = await getPlatformActionFees();
    const targetFee = Number(fee_partner_onboarding ?? 300000);

    // ------------------------------------------------------------------
    // 1. INITIATE SETUP PAYMENT (PAYU OR ZERO-FEE GRANT)
    // ------------------------------------------------------------------
    if (action === 'initiate_setup_payment' || action === 'pay_setup_fee') {
      const effectiveName = partnerName || user?.user_metadata?.full_name || 'Partner Principal';
      const effectiveEmail = partnerEmail || user?.email || 'partner@nothingness.asia';
      const effectivePhone = partnerPhone || user?.phone || (user?.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : '+91 99999 99999');

      // Create or update partner_profiles entry if user is authenticated
      let profileId: string | null = null;
      if (user) {
        const { data: existingProfile } = await adminSupabase
          .from('partner_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          profileId = existingProfile.id;
          await adminSupabase
            .from('partner_profiles')
            .update({
              full_name: effectiveName,
              email: effectiveEmail,
              phone: effectivePhone,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);
        } else {
          const { data: newProfile } = await adminSupabase
            .from('partner_profiles')
            .insert({
              user_id: user.id,
              full_name: effectiveName,
              email: effectiveEmail,
              phone: effectivePhone,
              status: targetFee <= 0 ? 'contract_pending' : 'pending_payment',
              setup_fee_paid: targetFee <= 0,
            })
            .select('id')
            .single();

          profileId = newProfile?.id || null;
        }
      }

      // If setup fee is set to ₹0 by Admin
      if (targetFee <= 0) {
        if (user) {
          const orderId = `partner_free_${user.id.slice(0, 8)}_${Date.now()}`;
          await adminSupabase.from('action_fee_orders').upsert({
            user_id: user.id,
            action_type: 'partner_onboarding',
            amount: 0,
            payment_order_id: orderId,
            payment_status: 'paid',
            metadata: { partnerName: effectiveName, partnerEmail: effectiveEmail, city, propertyAddress, free_grant: true },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'payment_order_id' });

          await adminSupabase
            .from('partner_profiles')
            .update({
              setup_fee_paid: true,
              setup_fee_tx_id: orderId,
              status: 'contract_pending',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
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
          partnerName: effectiveName,
          partnerEmail: effectiveEmail,
          partnerPhone: effectivePhone,
          city: city || 'New Delhi',
          propertyAddress: propertyAddress || '',
          profileId,
        },
      });

      const { paymentUrl, params } = await createPayUPaymentRequestAsync({
        txnid: orderId,
        amount: targetFee,
        productinfo: 'Sanctuary Partner Onboarding Setup Fee',
        firstname: effectiveName,
        email: effectiveEmail,
        phone: effectivePhone.replace(/[^0-9]/g, '').slice(-10) || '9999999999',
        udf1: user?.id || orderId,
        udf2: 'partner_onboarding_fee',
        udf3: orderId,
        udf4: city || 'PAN India',
        udf5: effectiveName,
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

    // ------------------------------------------------------------------
    // 2. SIGN 70/30 MOU CONTRACT
    // ------------------------------------------------------------------
    if (action === 'sign_mou') {
      const signedAt = new Date().toISOString();
      const effectiveCity = city || 'National Capital Territory / Pan-India';
      const effectiveSignature = signatureText || partnerName || 'Partner Principal';

      if (user) {
        const { data: existingProfile } = await adminSupabase
          .from('partner_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          await adminSupabase
            .from('partner_profiles')
            .update({
              contract_signed: true,
              contract_signed_at: signedAt,
              contract_city: effectiveCity,
              status: existingProfile.status === 'active' ? 'active' : 'affidavit_pending',
              updated_at: signedAt,
            })
            .eq('id', existingProfile.id);
        } else {
          await adminSupabase
            .from('partner_profiles')
            .insert({
              user_id: user.id,
              full_name: effectiveSignature,
              email: partnerEmail || user.email || 'partner@nothingness.asia',
              phone: partnerPhone || user.phone || '+91 99999 99999',
              contract_signed: true,
              contract_signed_at: signedAt,
              contract_city: effectiveCity,
              status: 'affidavit_pending',
              setup_fee_paid: targetFee <= 0,
            });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'MoU agreement signed and recorded successfully.',
        signedAt,
        contractCity: effectiveCity,
        signatureText: effectiveSignature,
      });
    }

    // ------------------------------------------------------------------
    // 3. SUBMIT PROPERTY OWNERSHIP & NOC AFFIDAVIT
    // ------------------------------------------------------------------
    if (action === 'submit_affidavit') {
      if (!affidavitUrl) {
        return NextResponse.json({ error: 'Affidavit URL or file scan is required.' }, { status: 400 });
      }

      const effectiveAddress = propertyAddress || locality || 'Private Sanctuary';
      const effectiveCity = city || 'New Delhi';
      const effectiveState = state || 'Delhi (NCT)';
      const effectiveTier = (spaceTier === 'budget' ? 'budget' : 'luxury') as 'budget' | 'luxury';
      const effectiveTitle = propertyTitle || `${effectiveTier === 'luxury' ? 'The Amber Sanctuary' : 'The Urban Sanctuary'} @ ${effectiveAddress}`;

      let partnerProfileId: string | null = null;

      if (user) {
        const { data: profile } = await adminSupabase
          .from('partner_profiles')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          partnerProfileId = profile.id;
          await adminSupabase
            .from('partner_profiles')
            .update({
              affidavit_uploaded: true,
              affidavit_url: affidavitUrl,
              affidavit_notes: `${effectiveAddress}, ${effectiveCity}, ${effectiveState}`,
              status: profile.status === 'active' ? 'active' : 'under_review',
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);
        } else {
          const { data: newProfile } = await adminSupabase
            .from('partner_profiles')
            .insert({
              user_id: user.id,
              full_name: partnerName || user.user_metadata?.full_name || 'Partner Host',
              email: partnerEmail || user.email || 'partner@nothingness.asia',
              phone: partnerPhone || user.phone || '+91 99999 99999',
              contract_signed: true,
              contract_signed_at: new Date().toISOString(),
              contract_city: effectiveCity,
              affidavit_uploaded: true,
              affidavit_url: affidavitUrl,
              affidavit_notes: `${effectiveAddress}, ${effectiveCity}, ${effectiveState}`,
              status: 'under_review',
              setup_fee_paid: targetFee <= 0,
            })
            .select('id')
            .single();

          partnerProfileId = newProfile?.id || null;
        }

        // Create initial property record in partner_properties if partnerProfileId exists
        if (partnerProfileId) {
          await adminSupabase
            .from('partner_properties')
            .insert({
              partner_id: partnerProfileId,
              title: effectiveTitle,
              state: effectiveState,
              city: effectiveCity,
              locality: effectiveAddress,
              carpet_area: carpetArea || '1,100 sq ft',
              space_tier: effectiveTier,
              ownership_confirmed: true,
              lounge_eligible: false,
              housekeeping_status: 'ready',
            });
        }
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
