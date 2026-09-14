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
    const failureReason = body.error_Message || body.unmappedstatus || body.field9 || 'Payment failed or was cancelled.';

    console.log(`[PayU Callback] Received ${isGet ? 'GET' : 'POST'} for txnid: ${txnid}, status: ${status}, type: ${paymentType}`);

    const isHashValid = verifyPayUResponseHash(body);
    if (!isHashValid && txnid) {
      console.warn('[PayU Callback] Hash check failed or missing. Verifying via PayU S2S API:', txnid);
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
          try {
            const { sendPushNotificationToUser } = await import('@/lib/webpush');
            await sendPushNotificationToUser(targetUserId, {
              title: '✨ Sanctuary Pass Activated',
              body: 'Your Lifetime Sanctuary Pass is active. The private gatherings portal is now unlocked.',
              url: '/sanctuary-pass',
            });
          } catch (pushErr) {
            console.warn('[PayU Callback] Sanctuary pass WebPush warning:', pushErr);
          }
        }

        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?pass_purchased=true`, 303);
      } else {
        const errorMsg = encodeURIComponent(failureReason);
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
            try {
              const { checkAndPromoteWaitlistedCandidates } = await import('@/lib/events/ratio-balancer');
              await checkAndPromoteWaitlistedCandidates(eventId);
            } catch (ratioErr) {
              console.warn('[PayU Callback] Ratio balance warning:', ratioErr);
            }
          }

          // Dispatch WebPush
          if (targetUserId) {
            try {
              const { sendPushNotificationToUser } = await import('@/lib/webpush');
              await sendPushNotificationToUser(targetUserId, {
                title: '🎟️ Gathering Pass Confirmed',
                body: `Your ticket for "${updatedApp?.sanctuary_events?.title || 'Sanctuary Gathering'}" is confirmed. Entry QR is ready.`,
                url: `/sanctuary-pass?eventId=${eventId}`,
              });
            } catch (pushErr) {
              console.warn('[PayU Callback] Event ticket WebPush warning:', pushErr);
            }
          }
        }

        return NextResponse.redirect(`${siteUrl}/sanctuary-pass?eventId=${eventId}&ticket_confirmed=true`, 303);
      } else {
        const errorMsg = encodeURIComponent(failureReason);
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
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        const errorMsg = encodeURIComponent(failureReason);
        return NextResponse.redirect(`${siteUrl}/partner/onboarding?payment=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 2. THE CIRCLE / PRIVATE SOCIETY MEMBERSHIP FEE
    // ------------------------------------------------------------------
    if (
      paymentType === 'circle_activation_fee' ||
      paymentType === 'society_activation_fee' ||
      paymentType === 'kinkster_activation_fee' ||
      txnid.startsWith('circle_') ||
      txnid.startsWith('kinkster_')
    ) {
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

        return NextResponse.redirect(`${siteUrl}/the-circle?activation=success`, 303);
      } else {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        const errorMsg = encodeURIComponent(failureReason);
        return NextResponse.redirect(`${siteUrl}/the-circle?activation=failed&error=${errorMsg}`, 303);
      }
    }

    // ------------------------------------------------------------------
    // 3. STATUTORY ID VERIFICATION FEE
    // ------------------------------------------------------------------
    if (paymentType === 'id_verification_fee' || txnid.startsWith('idverify_')) {
      const originContext = udf4 || ''; // token or bookingId or empty
      const isBookingId = /^[0-9a-fA-F-]{36}$/.test(originContext);
      const isGuestToken = Boolean(originContext && !isBookingId);

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

        if (isBookingId) {
          return NextResponse.redirect(`${siteUrl}/booking/${originContext}/verify?id_verified=true&payment=success`, 303);
        } else if (isGuestToken) {
          return NextResponse.redirect(`${siteUrl}/verify-guest/${originContext}?id_verified=true&payment=success`, 303);
        }
        return NextResponse.redirect(`${siteUrl}/dashboard?id_verified=true&payment=success`, 303);
      } else {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        const errorMsg = encodeURIComponent(failureReason);
        if (isBookingId) {
          return NextResponse.redirect(`${siteUrl}/booking/${originContext}/verify?id_verified=failed&error=${errorMsg}`, 303);
        } else if (isGuestToken) {
          return NextResponse.redirect(`${siteUrl}/verify-guest/${originContext}?id_verified=failed&error=${errorMsg}`, 303);
        }
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
        await supabaseAdmin
          .from('booking_guests')
          .update({
            payment_status: 'failed',
          })
          .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`);

        const errorMsg = encodeURIComponent(failureReason);
        const redirectTarget = udf3
          ? `${siteUrl}/verify-guest/${udf3}?payment=failed&error=${errorMsg}`
          : `${siteUrl}/dashboard?payment=failed`;

        return NextResponse.redirect(redirectTarget, 303);
      }
    }

    // ------------------------------------------------------------------
    // 5. PRIMARY SANCTUARY BOOKING STAY
    // ------------------------------------------------------------------
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, check_in, check_out, guest_name, guest_email, guest_phone, total_price, spaces(title), booking_guests(id, name, phone, email, verification_token, is_primary, payment_status, payment_amount)')
      .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`)
      .maybeSingle();

    if (status === 'success') {
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

          // Dispatch confirmation to primary booker and invitations to additional guests
          if (existingBooking.booking_guests) {
            try {
              const { 
                sendAdditionalGuestInviteNotification,
                sendPrimaryBookingConfirmationNotification,
              } = await import('@/lib/notifications/verification');
              const spaceRecord: any = Array.isArray(existingBooking.spaces) ? existingBooking.spaces[0] : existingBooking.spaces;

              // 1. Dispatch confirmation email & invoice link to primary guest
              const primaryGuest = existingBooking.booking_guests.find((g: any) => g.is_primary);
              const primaryEmail = existingBooking.guest_email || primaryGuest?.email;
              const primaryName = existingBooking.guest_name || primaryGuest?.name || 'Sanctuary Guest';

              if (primaryEmail) {
                sendPrimaryBookingConfirmationNotification({
                  email: primaryEmail,
                  guestName: primaryName,
                  bookingId: existingBooking.id,
                  spaceTitle: spaceRecord?.title || 'Private Sanctuary',
                  checkInDate: existingBooking.check_in,
                  checkOutDate: existingBooking.check_out,
                  totalAmount: existingBooking.total_price || 0,
                  paymentMethod: 'PayU India (UPI / Cards / Net Banking)',
                }).catch((err) => console.warn('[PayU Callback] Primary booking email dispatch warning:', err));
              }

              // 2. Dispatch invitations to co-guests
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

          // 3. Dispatch Stage 1 Omnichannel Booking Confirmation & ID Request
          try {
            const { dispatchStage1BookingConfirmation } = await import('@/lib/chat/guest-journey');
            await dispatchStage1BookingConfirmation(existingBooking.id);
          } catch (stage1Err) {
            console.warn('[PayU Callback] Stage 1 dispatch warning:', stage1Err);
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

        try {
          const { dispatchStage1BookingConfirmation } = await import('@/lib/chat/guest-journey');
          await dispatchStage1BookingConfirmation(udf1);
        } catch (stage1Err) {
          console.warn('[PayU Callback] Stage 1 dispatch warning for udf1:', stage1Err);
        }

        return NextResponse.redirect(`${siteUrl}/booking/${udf1}/verify?payment=success`, 303);
      }

      return NextResponse.redirect(`${siteUrl}/dashboard?payment=success`, 303);
    } else {
      const errorMsg = encodeURIComponent(failureReason);
      
      // Record payment failure while retaining booking ID for immediate retry
      const bookingTargetId = existingBooking?.id || udf1;
      if (bookingTargetId) {
        try {
          await supabaseAdmin
            .from('bookings')
            .update({
              payment_status: 'failed',
            })
            .eq('id', bookingTargetId);
        } catch (updateErr) {
          console.warn('[PayU Callback] Failed to record booking payment failure:', updateErr);
        }

        return NextResponse.redirect(`${siteUrl}/booking/${bookingTargetId}/verify?payment=failed&error=${errorMsg}`, 303);
      }

      return NextResponse.redirect(`${siteUrl}/spaces?payment=failed&error=${errorMsg}`, 303);
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
