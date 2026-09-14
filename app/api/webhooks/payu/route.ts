import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPayUResponseHash, verifyPaymentWithPayUS2S } from '@/lib/payu';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, any> = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    let status = (body.status || '').toLowerCase();
    const txnid = body.txnid || body.merchantTransactionId || '';
    const udf1 = body.udf1 || '';
    const paymentType = body.udf2 || '';
    const udf3 = body.udf3 || '';
    const udf4 = body.udf4 || '';
    const udf5 = body.udf5 || '';
    const failureReason = body.error_Message || body.unmappedstatus || body.field9 || 'Payment failed at gateway';

    console.log(`[PayU Webhook] Notification received for txnid: ${txnid}, status: ${status}, type: ${paymentType}`);

    // Verify hash integrity with S2S verification fallback
    const isHashValid = verifyPayUResponseHash(body);
    if (!isHashValid && txnid) {
      console.warn('[PayU Webhook] Hash validation mismatch for txnid. Verifying with PayU S2S:', txnid);
      const s2sResult = await verifyPaymentWithPayUS2S(txnid);
      if (s2sResult.success) {
        console.log('[PayU Webhook] S2S confirmed payment success for txnid:', txnid);
        status = 'success';
      } else {
        console.warn('[PayU Webhook] S2S verification returned status:', s2sResult.status);
      }
    }

    const supabaseAdmin = createAdminClient();

    // =========================================================================
    // 0. ONE-TIME SANCTUARY PASS LIFETIME MEMBERSHIP
    // =========================================================================
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
            console.warn('[PayU Webhook] Sanctuary pass WebPush warning:', pushErr);
          }
        }
        return NextResponse.json({ status: 'ok', message: 'Sanctuary Pass confirmed via webhook' }, { status: 200 });
      } else {
        console.warn(`[PayU Webhook] Sanctuary pass payment failed for txnid ${txnid}: ${failureReason}`);
        return NextResponse.json({ status: 'failed', message: 'Recorded pass payment failure' }, { status: 200 });
      }
    }

    // =========================================================================
    // 0.1 EVENT TICKET GATHERING PASS
    // =========================================================================
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

          if (eventId) {
            try {
              const { checkAndPromoteWaitlistedCandidates } = await import('@/lib/events/ratio-balancer');
              await checkAndPromoteWaitlistedCandidates(eventId);
            } catch (ratioErr) {
              console.warn('[PayU Webhook] Ratio balance warning:', ratioErr);
            }
          }

          if (targetUserId) {
            try {
              const { sendPushNotificationToUser } = await import('@/lib/webpush');
              await sendPushNotificationToUser(targetUserId, {
                title: '🎟️ Gathering Pass Confirmed',
                body: `Your ticket for "${updatedApp?.sanctuary_events?.title || 'Sanctuary Gathering'}" is confirmed. Entry QR is ready.`,
                url: `/sanctuary-pass?eventId=${eventId}`,
              });
            } catch (pushErr) {
              console.warn('[PayU Webhook] Event ticket WebPush warning:', pushErr);
            }
          }
        }
        return NextResponse.json({ status: 'ok', message: 'Event ticket confirmed via webhook' }, { status: 200 });
      } else {
        console.warn(`[PayU Webhook] Ticket payment failed for txnid ${txnid}: ${failureReason}`);
        return NextResponse.json({ status: 'failed', message: 'Recorded ticket payment failure' }, { status: 200 });
      }
    }

    // =========================================================================
    // 1. PARTNER ONBOARDING SETUP FEE
    // =========================================================================
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
        return NextResponse.json({ status: 'ok', message: 'Partner onboarding fee confirmed' }, { status: 200 });
      } else {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        return NextResponse.json({ status: 'failed', message: 'Partner setup payment failed recorded' }, { status: 200 });
      }
    }

    // =========================================================================
    // 2. THE CIRCLE / PRIVATE SOCIETY MEMBERSHIP FEE
    // =========================================================================
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
        return NextResponse.json({ status: 'ok', message: 'Kinkster activation fee confirmed' }, { status: 200 });
      } else {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        return NextResponse.json({ status: 'failed', message: 'Kinkster activation payment failed recorded' }, { status: 200 });
      }
    }

    // =========================================================================
    // 3. STATUTORY ID VERIFICATION FEE
    // =========================================================================
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
        return NextResponse.json({ status: 'ok', message: 'ID verification fee confirmed' }, { status: 200 });
      } else {
        await supabaseAdmin
          .from('action_fee_orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', txnid);

        return NextResponse.json({ status: 'failed', message: 'ID verification fee failed recorded' }, { status: 200 });
      }
    }

    // =========================================================================
    // 4. GUEST SELF-PAY ORDER
    // =========================================================================
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

        return NextResponse.json({ status: 'ok', message: 'Guest self-payment confirmed' }, { status: 200 });
      } else {
        await supabaseAdmin
          .from('booking_guests')
          .update({
            payment_status: 'failed',
          })
          .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`);

        return NextResponse.json({ status: 'failed', message: 'Guest self-payment failed recorded' }, { status: 200 });
      }
    }

    // =========================================================================
    // 5. MAIN SANCTUARY BOOKING STAY PAYMENT
    // =========================================================================
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, check_in, check_out, guest_name, guest_email, guest_phone, total_price, spaces(title), booking_guests(id, name, phone, email, verification_token, is_primary, payment_status, payment_amount)')
      .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`)
      .maybeSingle();

    if (status === 'success') {
      if (existingBooking?.payment_status === 'paid') {
        return NextResponse.json({ status: 'ok', message: 'Already processed' }, { status: 200 });
      }

      if (existingBooking) {
        const { error } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'PayU',
          })
          .eq('id', existingBooking.id);

        if (error) {
          console.error('[PayU Webhook] DB update error:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Dispatch confirmation to primary booker & invitation links to additional guests
        if (existingBooking.booking_guests) {
          try {
            const { 
              sendAdditionalGuestInviteNotification,
              sendPrimaryBookingConfirmationNotification,
            } = await import('@/lib/notifications/verification');
            const spaceRecord: any = Array.isArray(existingBooking.spaces) ? existingBooking.spaces[0] : existingBooking.spaces;

            // 1. Dispatch primary confirmation email with invoice
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
              }).catch((err) => console.warn('[PayU Webhook] Primary booking email dispatch warning:', err));
            }

            // 2. Dispatch co-guest invitations
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

            // 3. Dispatch Stage 1 Omnichannel Booking Confirmation & ID Request
            try {
              const { dispatchStage1BookingConfirmation } = await import('@/lib/chat/guest-journey');
              await dispatchStage1BookingConfirmation(existingBooking.id);
            } catch (stage1Err) {
              console.warn('[PayU Webhook] Stage 1 dispatch warning:', stage1Err);
            }
          } catch (notifyErr) {
            console.warn('[PayU Webhook] Invite notification warning:', notifyErr);
          }
        }
      } else if (udf1) {
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
          console.warn('[PayU Webhook] Stage 1 dispatch warning for udf1:', stage1Err);
        }
      }

      return NextResponse.json({ status: 'ok', message: 'Payment confirmed successfully' }, { status: 200 });
    } else {
      // Payment failure/cancellation recorded for booking
      console.warn(`[PayU Webhook] Booking payment failed for txnid ${txnid}: ${failureReason}`);
      if (existingBooking) {
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'failed',
          })
          .eq('id', existingBooking.id);
      } else if (udf1) {
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'failed',
          })
          .eq('id', udf1);
      }

      return NextResponse.json({ status: 'failed', message: 'Booking payment failure recorded' }, { status: 200 });
    }
  } catch (error: any) {
    console.error('[PayU Webhook] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
