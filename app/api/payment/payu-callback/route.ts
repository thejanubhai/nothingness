import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPayUResponseHash, verifyPaymentWithPayUS2S } from '@/lib/payu';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

async function handlePayUCallback(req: NextRequest, isGet = false) {
  try {
    const body: Record<string, string> = {};

    if (isGet) {
      req.nextUrl.searchParams.forEach((value, key) => {
        body[key] = value;
      });
    } else {
      try {
        const formData = await req.formData();
        formData.forEach((value, key) => {
          body[key] = value.toString();
        });
      } catch (_) {
        try {
          const json = await req.json();
          Object.entries(json).forEach(([k, v]) => {
            body[k] = String(v);
          });
        } catch (_) {}
      }
    }

    let status = (body.status || '').toLowerCase();
    const txnid = body.txnid || '';
    const udf1 = body.udf1 || '';
    const paymentType = body.udf2 || '';
    const udf3 = body.udf3 || '';
    const udf4 = body.udf4 || '';
    const udf5 = body.udf5 || '';
    const siteUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';

    console.log(`[PayU Callback] Received ${isGet ? 'GET' : 'POST'} for txnid: ${txnid}, status: ${status}, type: ${paymentType}`);

    const isHashValid = verifyPayUResponseHash(body);
    if (!isHashValid && txnid) {
      console.warn('[PayU Callback] Hash check failed or missing. Verifying via PayU S2S API:', txnid);
      // Double check directly with PayU S2S server
      const s2sResult = await verifyPaymentWithPayUS2S(txnid);
      if (s2sResult.success) {
        console.log('[PayU Callback] PayU S2S confirmed payment success for txnid:', txnid);
        status = 'success';
      } else {
        console.warn('[PayU Callback] S2S verify returned:', s2sResult.status);
      }
    }

    const supabaseAdmin = createAdminClient();

    // ------------------------------------------------------------------
    // TEST TRANSACTION / GATEWAY ACTIVATION (₹10 TEST VERIFICATION)
    // ------------------------------------------------------------------
    if (paymentType === 'test_verification' || txnid.startsWith('testpay_')) {
      if (status === 'success') {
        const amt = body.amount || '10.00';
        return NextResponse.redirect(`${siteUrl}/test-pay?status=success&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amt)}`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Transaction failed or was cancelled.');
        return NextResponse.redirect(`${siteUrl}/test-pay?status=failed&txnid=${encodeURIComponent(txnid)}&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 0. ONE-TIME SANCTUARY PASS LIFETIME MEMBERSHIP
    // ------------------------------------------------------------------
    if (paymentType === 'sanctuary_pass_fee' || txnid.startsWith('spass_')) {
      if (status === 'success') {
        const targetUserId = udf1 || udf5;
        const amountPaid = Number(udf3) || 1499;

        if (targetUserId) {
          await supabaseAdmin
            .from('sanctuary_passes')
            .upsert(
              {
                user_id: targetUserId,
                status: 'active',
                amount_paid: amountPaid,
                order_id: txnid,
                created_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          // Dispatch WebPush
          const { sendPushNotificationToUser } = await import('@/lib/webpush');
          await sendPushNotificationToUser(targetUserId, {
            title: '✨ Sanctuary Pass Activated',
            body: 'Your Lifetime Sanctuary Pass is active. The private gatherings portal is now unlocked.',
            url: '/sanctuary-pass',
          }).catch(console.error);
        }

        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?pass_purchased=true`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Sanctuary Pass payment failed.');
        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?payment=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 0.1 EVENT TICKET GATHERING PASS
    // ------------------------------------------------------------------
    if (paymentType === 'event_ticket_fee' || txnid.startsWith('evtticket_')) {
      const appId = udf1;
      const eventId = udf3;
      const targetUserId = udf5;
      const amountPaid = Number(udf4) || 0;

      if (status === 'success') {
        if (appId) {
          const { data: updatedApp } = await supabaseAdmin
            .from('sanctuary_event_applications')
            .update({
              status: 'confirmed',
              ticket_price_paid: amountPaid,
              payment_order_id: txnid,
              updated_at: new Date().toISOString(),
            })
            .eq('id', appId)
            .select('*, sanctuary_events(title)')
            .single();

          // Re-balance waitlist if slot was filled
          if (eventId) {
            const { checkAndPromoteWaitlistedCandidates } = await import('@/lib/events/ratio-balancer');
            await checkAndPromoteWaitlistedCandidates(eventId).catch(console.error);
          }

          // Dispatch WebPush
          if (targetUserId) {
            const { sendPushNotificationToUser } = await import('@/lib/webpush');
            await sendPushNotificationToUser(targetUserId, {
              title: '🎟️ Gathering Pass Confirmed',
              body: `Your ticket for "${updatedApp?.sanctuary_events?.title || 'Sanctuary Gathering'}" is confirmed. Entry QR is ready.`,
              url: `/sanctuary-pass?eventId=${eventId}`,
            }).catch(console.error);
          }
        }

        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?eventId=${eventId}&ticket_confirmed=true`, 303);
      } else {
        const errorMsg = encodeURIComponent(body.error_Message || body.unmappedstatus || 'Ticket payment failed.');
        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?eventId=${eventId}&payment=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 1. PARTNER ONBOARDING SETUP FEE
    // ------------------------------------------------------------------
    if (paymentType === 'partner_onboarding_fee' || txnid.startsWith('partner_')) {
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

        if (targetUserId && targetUserId !== 'guest') {
          const { data: existingProfile } = await supabaseAdmin
            .from('partner_profiles')
            .select('id, status')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (existingProfile) {
            await supabaseAdmin
              .from('partner_profiles')
              .update({
                setup_fee_paid: true,
                setup_fee_tx_id: txnid,
                status: existingProfile.status === 'pending_payment' ? 'contract_pending' : existingProfile.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProfile.id);
          } else {
            await supabaseAdmin
              .from('partner_profiles')
              .insert({
                user_id: targetUserId,
                full_name: meta.partnerName || udf5 || 'Partner Host',
                email: meta.partnerEmail || 'partner@nothingness.asia',
                phone: meta.partnerPhone || '+91 99999 99999',
                setup_fee_paid: true,
                setup_fee_tx_id: txnid,
                status: 'contract_pending',
              });
          }
        }

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
    const siteUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
    return NextResponse.redirect(`${siteUrl}/dashboard?payment=error`, 303);
  }
}

export async function POST(req: NextRequest) {
  return handlePayUCallback(req, false);
}

export async function GET(req: NextRequest) {
  return handlePayUCallback(req, true);
}
