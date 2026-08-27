import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPayUResponseHash } from '@/lib/payu';
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

    const status = (body.status || '').toLowerCase();
    const txnid = body.txnid || body.merchantTransactionId || '';
    const udf1 = body.udf1 || '';
    const paymentType = body.udf2 || '';
    const udf4 = body.udf4 || '';

    console.log(`[PayU Webhook] Notification received for txnid: ${txnid}, status: ${status}, type: ${paymentType}`);

    if (status !== 'success') {
      return NextResponse.json({ status: 'ignored', message: `Status is ${status}` }, { status: 200 });
    }

    const isHashValid = verifyPayUResponseHash(body);
    if (!isHashValid) {
      console.warn('[PayU Webhook] Hash validation mismatch for txnid:', txnid);
    }

    const supabaseAdmin = createAdminClient();

    // 1. Partner Onboarding Setup Fee
    if (paymentType === 'partner_onboarding_fee' || txnid.startsWith('partner_')) {
      await supabaseAdmin
        .from('action_fee_orders')
        .update({
          payment_status: 'paid',
          payment_id: txnid,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_order_id', txnid);

      return NextResponse.json({ status: 'ok', message: 'Partner onboarding fee confirmed' }, { status: 200 });
    }

    // 2. Kinkster Mode Lifetime Membership Fee
    if (paymentType === 'kinkster_activation_fee' || txnid.startsWith('kinkster_')) {
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
    }

    // 3. Statutory ID Verification Fee
    if (paymentType === 'id_verification_fee' || txnid.startsWith('idverify_')) {
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
    }

    // 4. Guest Self-Pay Order
    if (paymentType === 'guest_self_pay' || txnid.startsWith('guest_pay_')) {
      await supabaseAdmin
        .from('booking_guests')
        .update({
          payment_status: 'paid',
          payment_id: txnid,
          paid_at: new Date().toISOString(),
        })
        .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`);

      return NextResponse.json({ status: 'ok', message: 'Guest self-payment confirmed' }, { status: 200 });
    }

    // 5. Main Booking Payment
    const { data: existingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, check_in, check_out, guest_name, spaces(title), booking_guests(id, name, phone, email, verification_token, is_primary, payment_status, payment_amount)')
      .or(`payment_order_id.eq.${txnid},id.eq.${udf1}`)
      .maybeSingle();

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

      // Dispatch invitation & verification links to additional guests
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
          console.warn('[PayU Webhook] Invite notification warning:', notifyErr);
        }
      }
    }

    return NextResponse.json({ status: 'ok', message: 'Payment confirmed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[PayU Webhook] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
