import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationApprovedNotification } from '@/lib/notifications/verification';
import { getPlatformActionFees, createPayUPaymentRequest } from '@/lib/payu';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, guestId, token, phone, frontImage, backImage, mimeType } = body;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 0. Resolve active session user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    const sessionPhone = user?.phone ? user.phone.replace(/[^0-9+]/g, '') : null;
    const sessionUserId = user?.id || null;
    const sessionEmail = user?.email || null;

    const effectivePhone = phone
      ? phone.replace(/[^0-9+]/g, '')
      : sessionPhone;

    // ------------------------------------------------------------------
    // 1. Check if guest is already verified by phone number within 180 days
    // ------------------------------------------------------------------
    if (effectivePhone) {
      const { data: existingProfile } = await adminSupabase
        .from('guest_profiles')
        .select('*')
        .eq('phone', effectivePhone)
        .eq('is_verified', true)
        .gt('verification_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        // Link to booking if booking details provided
        if (bookingId && guestId) {
          await adminSupabase
            .from('booking_guests')
            .update({
              verification_status: 'verified',
              name: existingProfile.full_name,
              guest_profile_id: existingProfile.id,
            })
            .eq('id', guestId)
            .eq('booking_id', bookingId);
        } else if (token) {
          await adminSupabase
            .from('booking_guests')
            .update({
              verification_status: 'verified',
              name: existingProfile.full_name,
              guest_profile_id: existingProfile.id,
            })
            .eq('verification_token', token);
        }

        // Link user_id if logged in
        if (sessionUserId && !existingProfile.user_id) {
          await adminSupabase
            .from('guest_profiles')
            .update({ user_id: sessionUserId })
            .eq('id', existingProfile.id);
        }

        return NextResponse.json(
          {
            verified: true,
            reusedExisting: true,
            name: existingProfile.full_name,
            expires_at: existingProfile.verification_expires_at,
            message: `Welcome back ${existingProfile.full_name}! Your ID verification is valid for 180 days (expires ${new Date(existingProfile.verification_expires_at).toLocaleDateString()}). No re-verification required.`,
          },
          { status: 200 }
        );
      }
    }

    if (!frontImage || !backImage) {
      return NextResponse.json(
        { error: 'Both Front and Back photos of Aadhaar Card or Passport are required.' },
        { status: 400 }
      );
    }

    // Clean image data if passed as Data URLs
    const cleanFront = frontImage.includes('base64,') ? frontImage.split('base64,')[1] : frontImage;
    const cleanBack = backImage.includes('base64,') ? backImage.split('base64,')[1] : backImage;
    const imageMimeType = mimeType || 'image/jpeg';

    // 2. Optical Document Recognition via Gemini AI Vision
    const apiKey = process.env.GEMINI_API_KEY;
    let result: {
      valid: boolean;
      name: string;
      dob?: string;
      above18?: boolean;
      document_type?: string;
      document_number?: string;
      permanent_address?: string;
      is_foreign_national?: boolean;
      nationality?: string;
      reason?: string;
    } = {
      valid: true,
      name: 'Nothingness Guest',
      document_type: 'Aadhaar',
      document_number: '',
      above18: true,
      nationality: 'Indian',
      is_foreign_national: false,
    };

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Analyze these two images representing the FRONT and BACK of a guest identity document for "Nothingness" luxury retreats.
        
        STRICT VERIFICATION RULES:
        1. Document MUST be an official AADHAAR CARD or PASSPORT. 
        2. Driving License (DL), Voter ID, PAN Card, or any other document MUST BE STRICTLY REJECTED with reason: "Driving License and Voter ID are not accepted. Please upload a clear Aadhaar Card or Passport."
        3. Primary booker MUST be 18 years of age or older based on Date of Birth.
        4. Extract full name, document type ("Aadhaar" or "Passport"), document number, DOB, and permanent address.
        
        Return ONLY a valid JSON object matching this exact schema:
        {
          "valid": true,
          "name": "Full Legal Name",
          "dob": "DD/MM/YYYY",
          "above18": true,
          "document_type": "Aadhaar" or "Passport",
          "document_number": "XXXX",
          "permanent_address": "Extracted address from card",
          "is_foreign_national": false,
          "nationality": "Indian",
          "reason": "Reason if rejected"
        }`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { data: cleanFront, mimeType: imageMimeType } },
                { inlineData: { data: cleanBack, mimeType: imageMimeType } },
              ],
            },
          ],
        });

        const responseText = response.text || '{}';
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && typeof parsed === 'object') {
          result = { ...result, ...parsed };
        }
      } catch (aiErr: any) {
        console.warn('[Verify ID] Gemini OCR processing warning:', aiErr?.message);
      }
    }

    if (!result.valid) {
      return NextResponse.json(
        {
          verified: false,
          reason:
            result.reason ||
            'Driving License and Voter ID are not accepted due to verification regulations. Please submit a valid Aadhaar Card or Passport.',
        },
        { status: 400 }
      );
    }

    if (result.above18 === false) {
      return NextResponse.json(
        {
          verified: false,
          reason: 'Per Delhi Hospitality Laws, primary guest must be at least 18 years of age.',
        },
        { status: 400 }
      );
    }

    // 3. Prepare verification records with 180-day validity
    const now = new Date();
    const expiresAt = addDays(now, 180).toISOString();
    const isForeign = !!result.is_foreign_national;
    const policeStatus = isForeign ? 'form_c_required' : 'verified_compliant';
    const guestName = result.name && result.name !== 'Nothingness Guest' ? result.name : (user?.user_metadata?.full_name || 'Guest');
    const docNumber = result.document_number ? result.document_number.trim().toUpperCase() : null;

    // 4. Dynamic Action Pricing Check for ID Verification
    const { fee_id_verification } = await getPlatformActionFees();

    if (fee_id_verification > 0) {
      // Check if user has already paid
      let hasPaid = false;
      if (sessionUserId) {
        const { data: paidOrder } = await adminSupabase
          .from('action_fee_orders')
          .select('id')
          .eq('user_id', sessionUserId)
          .eq('action_type', 'id_verification')
          .eq('payment_status', 'paid')
          .maybeSingle();
        if (paidOrder) hasPaid = true;
      }

      if (!hasPaid) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 7);
        const orderId = `idverify_${sessionUserId ? sessionUserId.slice(0, 6) : 'guest'}_${Date.now()}_${uniqueSuffix}`;

        // Save pending order with extracted ID metadata
        await adminSupabase.from('action_fee_orders').insert({
          user_id: sessionUserId || null,
          action_type: 'id_verification',
          amount: fee_id_verification,
          payment_order_id: orderId,
          payment_status: 'pending',
          metadata: {
            guestName,
            phone: effectivePhone,
            docNumber,
            docType: result.document_type || 'Aadhaar',
            dob: result.dob,
            permanentAddress: result.permanent_address,
            isForeign,
            bookingId,
            guestId,
            token,
          },
        });

        const { paymentUrl, params } = createPayUPaymentRequest({
          txnid: orderId,
          amount: fee_id_verification,
          productinfo: 'Delhi Police Statutory ID Verification Fee',
          firstname: guestName,
          email: sessionEmail || 'concierge@nothingness.asia',
          phone: effectivePhone || '9999999999',
          udf1: sessionUserId || orderId,
          udf2: 'id_verification_fee',
          udf3: orderId,
          udf4: token || bookingId || '',
        });

        return NextResponse.json({
          verified: false,
          requiresPayment: true,
          paymentUrl,
          params,
          orderId,
          fee: fee_id_verification,
          name: guestName,
        });
      }
    }

    let profileId: string | null = null;

    // Upsert into guest_profiles
    const profilePayload: any = {
      full_name: guestName,
      phone: effectivePhone || null,
      phone_number: effectivePhone || null,
      user_id: sessionUserId || null,
      id_document_type: result.document_type || 'Aadhaar',
      dob: result.dob || null,
      permanent_address: result.permanent_address || 'Address recorded on ID',
      is_foreign_national: isForeign,
      nationality: result.nationality || (isForeign ? 'Foreign' : 'Indian'),
      police_register_status: policeStatus,
      verification_timestamp: now.toISOString(),
      verification_expires_at: expiresAt,
      is_verified: true,
      is_prestored: false,
    };

    if (docNumber) {
      profilePayload.document_number = docNumber;
      const { data: upsertedProf, error: profError } = await adminSupabase
        .from('guest_profiles')
        .upsert(profilePayload, { onConflict: 'document_number' })
        .select()
        .single();

      if (!profError && upsertedProf) {
        profileId = upsertedProf.id;
      }
    } else if (effectivePhone) {
      const { data: upsertedProf, error: profError } = await adminSupabase
        .from('guest_profiles')
        .upsert(profilePayload, { onConflict: 'phone' })
        .select()
        .single();

      if (!profError && upsertedProf) {
        profileId = upsertedProf.id;
      }
    }

    if (!profileId) {
      const { data: newProf } = await adminSupabase
        .from('guest_profiles')
        .insert(profilePayload)
        .select()
        .single();
      if (newProf) profileId = newProf.id;
    }

    // 5. Update booking_guests if attached to booking
    if (token) {
      await adminSupabase
        .from('booking_guests')
        .update({
          verification_status: 'verified',
          name: guestName,
          guest_profile_id: profileId,
        })
        .eq('verification_token', token);
    } else if (bookingId && guestId) {
      await adminSupabase
        .from('booking_guests')
        .update({
          verification_status: 'verified',
          name: guestName,
          guest_profile_id: profileId,
        })
        .eq('id', guestId)
        .eq('booking_id', bookingId);
    }

    // 6. If user is logged in, link and activate kinkster profile
    if (sessionUserId) {
      try {
        await adminSupabase
          .from('kinkster_profiles')
          .update({
            confidentiality_agreed: true,
            confidentiality_agreed_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', sessionUserId);
      } catch (kinkErr) {
        console.warn('[Verify ID] Could not update kinkster profile:', kinkErr);
      }
    }

    // 7. Dispatch Verification Approval Notification
    try {
      let recipientEmail = sessionEmail;
      let spaceTitle: string | undefined;
      let checkIn: string | undefined;
      let checkOut: string | undefined;

      if (profileId && !recipientEmail) {
        const { data: prof } = await adminSupabase
          .from('guest_profiles')
          .select('email')
          .eq('id', profileId)
          .maybeSingle();
        if (prof?.email) recipientEmail = prof.email;
      }

      if (bookingId) {
        const { data: bData } = await adminSupabase
          .from('bookings')
          .select('check_in, check_out, spaces(title), guest_profiles(email)')
          .eq('id', bookingId)
          .maybeSingle();

        if (bData) {
          const spaceRecord: any = Array.isArray(bData.spaces) ? bData.spaces[0] : bData.spaces;
          const profileRecord: any = Array.isArray(bData.guest_profiles) ? bData.guest_profiles[0] : bData.guest_profiles;

          spaceTitle = spaceRecord?.title;
          checkIn = bData.check_in;
          checkOut = bData.check_out;
          if (!recipientEmail && profileRecord?.email) {
            recipientEmail = profileRecord.email;
          }
        }
      }

      if (recipientEmail) {
        await sendVerificationApprovedNotification({
          email: recipientEmail,
          guestName,
          spaceTitle,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          phone: effectivePhone || undefined,
        });
      }
    } catch (notifErr) {
      console.warn('[Verify ID] Failed to send email approval notification:', notifErr);
    }

    return NextResponse.json(
      {
        verified: true,
        name: guestName,
        document_type: result.document_type || 'Aadhaar',
        verification_expires_at: expiresAt,
        message: `Verification successful! Verified for 180 days (valid until ${new Date(expiresAt).toLocaleDateString()}). Nothingness guest credentials updated.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Verify ID] Fatal verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during verification' },
      { status: 500 }
    );
  }
}
