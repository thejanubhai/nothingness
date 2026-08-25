import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationApprovedNotification } from '@/lib/notifications/verification';
import { addDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, guestId, token, phone, frontImage, backImage, mimeType } = body;

    const supabase = await createClient();

    // ------------------------------------------------------------------
    // 1. Check if guest is already verified by phone number within 180 days
    // ------------------------------------------------------------------
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      const { data: existingProfile } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('is_verified', true)
        .gt('verification_expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (existingProfile) {
        // Link to booking without requiring new ID upload!
        if (bookingId && guestId) {
          await supabase
            .from('booking_guests')
            .update({ 
              verification_status: 'verified', 
              name: existingProfile.full_name,
              guest_profile_id: existingProfile.id
            })
            .eq('id', guestId)
            .eq('booking_id', bookingId);
        }

        return NextResponse.json({
          verified: true,
          reusedExisting: true,
          name: existingProfile.full_name,
          expires_at: existingProfile.verification_expires_at,
          message: `Welcome back ${existingProfile.full_name}! Your ID verification is valid for 180 days (expires ${new Date(existingProfile.verification_expires_at).toLocaleDateString()}). No re-verification required.`
        }, { status: 200 });
      }
    }

    if (!frontImage || !backImage) {
      return NextResponse.json({ error: 'Both Front and Back photos of Aadhaar Card or Passport are required.' }, { status: 400 });
    }

    if (!token && (!bookingId || !guestId) && !phone) {
      return NextResponse.json({ error: 'Missing identification credentials (token, phone, or booking details)' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Strict Security Rules: Aadhaar Card and Passport ONLY. Reject Driving License (DL) and Voter ID.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `Analyze these two images representing the FRONT and BACK of a guest identity document.
              
              STRICT VERIFICATION & SECURITY RULES:
              1. Document MUST be an official AADHAAR CARD or PASSPORT. 
              2. Driving License (DL), Voter ID, PAN Card, or any other document MUST BE STRICTLY REJECTED with reason: "Driving License and Voter ID are not accepted. Please upload a clear Aadhaar Card or Passport."
              3. Primary booker MUST be 18 years of age or older based on Date of Birth.
              4. Extract full name, document type ("Aadhaar" or "Passport"), document number, DOB, and permanent address.
              
              Return ONLY a valid JSON object matching this exact schema:
              {
                "valid": true/false,
                "name": "Full Name",
                "dob": "DD/MM/YYYY or YYYY",
                "above18": true/false,
                "document_type": "Aadhaar" or "Passport",
                "document_number": "XXXX",
                "permanent_address": "Extracted residential address",
                "is_foreign_national": true/false,
                "nationality": "Indian / Country Name",
                "reason": "Reason if rejected (e.g. if DL or Voter ID was provided or under 18)"
              }` 
            },
            { inlineData: { data: frontImage, mimeType: mimeType || 'image/jpeg' } },
            { inlineData: { data: backImage, mimeType: mimeType || 'image/jpeg' } }
          ]
        }
      ]
    });

    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ error: 'Optical verification parser error' }, { status: 500 });
    }

    if (!result.valid) {
      return NextResponse.json({ 
        verified: false, 
        reason: result.reason || 'Driving License and Voter ID are not accepted due to verification regulations. Please submit a valid Aadhaar Card or Passport.' 
      }, { status: 400 });
    }

    if (!result.above18) {
      return NextResponse.json({ verified: false, reason: 'Per Delhi Hospitality Laws, primary guest must be at least 18 years of age.' }, { status: 400 });
    }

    // Calculate 180 days expiration date
    const now = new Date();
    const expiresAt = addDays(now, 180).toISOString();
    const policeStatus = result.is_foreign_national ? 'form_c_required' : 'verified_compliant';
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : null;

    // 2. Upsert into global guest_profiles with 180-day validity
    let profileId = null;
    if (result.document_number) {
      const cleanDoc = result.document_number.trim().toUpperCase();
      const { data: profile, error: profileError } = await supabase
        .from('guest_profiles')
        .upsert(
          { 
            document_number: cleanDoc, 
            full_name: result.name,
            phone: cleanPhone,
            id_document_type: result.document_type,
            dob: result.dob,
            permanent_address: result.permanent_address || 'Address recorded on ID',
            is_foreign_national: !!result.is_foreign_national,
            nationality: result.nationality || (result.is_foreign_national ? 'Foreign' : 'Indian'),
            police_register_status: policeStatus,
            verification_timestamp: now.toISOString(),
            verification_expires_at: expiresAt,
            is_verified: true,
            is_prestored: false, // Claimed and officially verified
          }, 
          { onConflict: 'document_number' }
        )
        .select()
        .single();
        
      if (!profileError && profile) {
        profileId = profile.id;
      } else {
        console.error("Profile upsert error:", profileError);
      }
    }
    
    // 3. Update booking_guests
    let updateQuery = supabase
      .from('booking_guests')
      .update({ 
        verification_status: 'verified', 
        name: result.name,
        guest_profile_id: profileId
      });

    if (token) {
      updateQuery = updateQuery.eq('verification_token', token);
    } else if (bookingId && guestId) {
      updateQuery = updateQuery.eq('id', guestId).eq('booking_id', bookingId);
    }

    await updateQuery;

    // 4. Dispatch Verification Approval Notification via Resend
    try {
      let guestEmail = null;
      let spaceTitle = undefined;
      let checkIn = undefined;
      let checkOut = undefined;

      if (profileId) {
        const { data: prof } = await supabase
          .from('guest_profiles')
          .select('email, phone')
          .eq('id', profileId)
          .single();
        if (prof?.email) guestEmail = prof.email;
      }

      if (bookingId) {
        const { data: bData } = await supabase
          .from('bookings')
          .select('check_in, check_out, spaces(title), guest_profiles(email)')
          .eq('id', bookingId)
          .single();

        if (bData) {
          const spaceRecord: any = Array.isArray(bData.spaces) ? bData.spaces[0] : bData.spaces;
          const profileRecord: any = Array.isArray(bData.guest_profiles) ? bData.guest_profiles[0] : bData.guest_profiles;

          spaceTitle = spaceRecord?.title;
          checkIn = bData.check_in;
          checkOut = bData.check_out;
          if (!guestEmail && profileRecord?.email) {
            guestEmail = profileRecord.email;
          }
        }
      }

      if (guestEmail) {
        await sendVerificationApprovedNotification({
          email: guestEmail,
          guestName: result.name || 'Guest',
          spaceTitle,
          checkInDate: checkIn,
          checkOutDate: checkOut,
        });
      }
    } catch (notifErr) {
      console.error('Failed to send verification approval notification:', notifErr);
    }

    return NextResponse.json({ 
      verified: true, 
      name: result.name,
      document_type: result.document_type,
      verification_expires_at: expiresAt,
      message: `Verification successful! Verified for 180 days (valid until ${new Date(expiresAt).toLocaleDateString()}). Nothingness guest account updated.`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
