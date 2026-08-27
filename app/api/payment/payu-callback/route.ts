import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPayUResponseHash } from '@/lib/payu';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    const status = (body.status || '').toLowerCase();
    const txnid = body.txnid || '';
    const udf1 = body.udf1 || '';
    const paymentType = body.udf2 || '';
    const udf3 = body.udf3 || '';
    const udf4 = body.udf4 || '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

    console.log(`[PayU Callback] Received callback for txnid: ${txnid}, status: ${status}, type: ${paymentType}`);

    const isHashValid = verifyPayUResponseHash(body);
    if (!isHashValid) {
      console.warn('[PayU Callback] Hash verification mismatch. Inspecting parameters:', {
        txnid,
        status,
        receivedHash: body.hash,
      });
    }

    const supabaseAdmin = createAdminClient();

    // ------------------------------------------------------------------
    // 1. PARTNER ONBOARDING SETUP FEE
    // ------------------------------------------------------------------
    if (paymentType === 'partner_onboarding_fee' || txnid.startsWith('partner_')) {
      if (status === 'success') {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'paid',
            payment_id: txnid,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        return NextResponse.redirect(`${siteUrl}/partner/onboarding?step=2&payment=success`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Partner setup payment failed.');
        return NextResponse.redirect(`${siteUrl}/partner/onboarding?payment=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 2. KINKSTER MODE LIFETIME MEMBERSHIP FEE
    // ------------------------------------------------------------------
    if (paymentType === 'kinkster_activation_fee' || txnid.startsWith('kinkster_')) {
      if (status === 'success') {
        const { data: order } = await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'paid',
            payment_id: txnid,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid)
          .select('user_id, metadata')
          .maybeSingle();

        const targetUserId = order?.user_id || udf1;
        const meta = order?.metadata || {};

        if (targetUserId) {
          await supabaseAdmin
            .from('kinkster_profiles')
            .upsert({
              id: targetUserId,
              alias: meta.alias || udf4 || `kinkster_${targetUserId.slice(0, 6)}`,
              bio: meta.bio || 'Passionate about luxury stays & discretion.',
              avatar_url: meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
              is_activated: true,
              stay_verified: true,
              confidentiality_agreed: true,
              confidentiality_agreed_at: new Date().toISOString(),
              interests: (meta.kinks || []).map((k: any) => k.name || k.id),
              onboarding_answers: meta.onboarding_answers || {},
              updated_at: new Date().toISOString(),
            });
        }

        return NextResponse.redirect(`${siteUrl}/kinksters?activation=success`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Kinkster activation payment failed.');
        return NextResponse.redirect(`${siteUrl}/kinksters?activation=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 3. STATUTORY ID VERIFICATION FEE
    // ------------------------------------------------------------------
    if (paymentType === 'id_verification_fee' || txnid.startsWith('idverify_')) {
      if (status === 'success') {
        const { data: order } = await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'paid',
            payment_id: txnid,
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid)
          .select('user_id, metadata')
          .maybeSingle();

        const meta = order?.metadata || {};
        const now = new Date();
        const expiresAt = addDays(now, 180).toISOString();

        if (meta.phone || meta.docNumber) {
          await supabaseAdmin
            .from('guest_profiles')
            .upsert({
              full_name: meta.guestName || 'Nothingness Guest',
              phone: meta.phone || null,
              user_id: order?.user_id || null,
              id_document_type: meta.docType || 'Aadhaar',
              document_number: meta.docNumber || null,
              dob: meta.dob || null,
              permanent_address: meta.permanentAddress || 'Address on ID',
              is_foreign_national: !!meta.isForeign,
              police_register_status: meta.isForeign ? 'form_c_required' : 'verified_compliant',
              verification_timestamp: now.toISOString(),
              verification_expires_at: expiresAt,
              is_verified: true,
              is_prestored: false,
            });
        }

        return NextResponse.redirect(`${siteUrl}/dashboard?id_verified=true&payment=success`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'ID verification payment failed.');
        return NextResponse.redirect(`${siteUrl}/dashboard?id_verified=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 4. ADDITIONAL GUEST SELF-PAY
    // ------------------------------------------------------------------
    if (paymentType === 'guest_self_pay' || txnid.startsWith('guest_pay_')) {
      if (status === 'success') {
        await supabaseAdmin
          .from('booking_guests')
          .update({
            payment_status: 'paid',
            payment_id: txnid,
            paid_at: new Date().toISOString(),
          })
          .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`);

        const redirectTarget = udf3
          ? `${siteUrl}/verify-guest/${udf3}?payment=success`
          : `${siteUrl}/dashboard?payment=success`;

        return NextResponse.redirect(redirectTarget, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Payment could not be completed.');
        const redirectTarget = udf3
          ? `${siteUrl}/verify-guest/${udf3}?payment=failed&error=${errorMsg}`
          : `${siteUrl}/dashboard?payment=failed`;

        return NextResponse.redirect(redirectTarget, 303);
      }
    }

    // ------------------------------------------------------------------
    // 5. PRIMARY SANCTUARY BOOKING STAY
    // ------------------------------------------------------------------
    if (status === 'success') {
      const { data: existingBooking } = await supabaseAdmin
        .from('bookings')
        .select('id, payment_status, check_in, check_out, guest_name, spaces(title), booking_guests(id, name, phone, email, verification_token, is_primary, payment_status, payment_amount)')
        .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`)
        .maybeSingle();

      if (existingBooking) {
        if (existingBooking.payment_status !== 'paid') {
          await supabaseAdmin
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              payment_method: 'PayU',
            })
            .eq('id', existingBooking.id);

          // Dispatch invitation notifications to additional guests
          if (existingBooking.booking_guests) {
            try {
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
            } catch (notifyErr) {
              console.warn('[PayU Callback] Notification dispatch warning:', notifyErr);
            }
          }
        }

        return NextResponse.redirect(`${siteUrl}/booking/${existingBooking.id}/verify?payment=success`, 303);
      }

      if (udf1) {
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'PayU',
          })
          .eq('id', udf1);

        return NextResponse.redirect(`${siteUrl}/booking/${udf1}/verify?payment=success`, 303);
      }

      return NextResponse.redirect(`${siteUrl}/dashboard?payment=success`, 303);
    } else {
      const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Payment failed or was cancelled.');
      if (udf1) {
        return NextResponse.redirect(`${siteUrl}/booking/${udf1}/verify?payment=failed&error=${errorMsg}`, 303);
      }
      return NextResponse.redirect(`${siteUrl}/spaces?payment=failed`, 303);
    }
  } catch (error: any) {
    console.error('[PayU Callback] Unexpected error processing callback:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
    return NextResponse.redirect(`${siteUrl}/dashboard?payment=error`, 303);
  }
}
