import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { screenshots } = await req.json();

    if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one screenshot of your Airbnb, MakeMyTrip, Booking.com reservation, or WhatsApp/Instagram booking chat.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare multi-image parts for Gemini 2.5 Flash Vision
    const imageParts = screenshots.map((item: string, index: number) => {
      let base64Data = item;
      let mimeType = 'image/jpeg';

      if (item.startsWith('data:')) {
        const parts = item.split(',');
        mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        base64Data = parts[1];
      }

      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    });

    const promptText = `Analyze these ${screenshots.length} screenshot image(s) submitted as proof of a previous stay or booking with "Nothingness" (also known as Nothingness Inc, Nothingness Sanctuaries, or listings like The Void, The Mirage, Bangri, The Chamber, Delhi Luxury Suites, etc.).

EVIDENCE TYPES MAY INCLUDE:
1. Online Travel Agency (OTA) reservation confirmations: Airbnb, MakeMyTrip (MMT), Booking.com, Agoda, Goibibo, etc.
2. WhatsApp chat screenshots or Instagram DMs with the Nothingness host/concierge discussing booking confirmation, dates, payment, address, check-in instructions, or lockbox codes.
3. Payment receipts or bank/UPI transfer slips for Nothingness stays.

TASK:
Extract booking details with high precision and identify ALL guests mentioned across all screenshots.
If multiple screenshots are provided (e.g. WhatsApp chat history or Airbnb screens), aggregate all details into one coherent booking record.

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "is_valid_booking_proof": boolean,
  "confidence_score": number, // 0 to 100
  "platform": "airbnb" | "makemytrip" | "booking.com" | "agoda" | "whatsapp" | "instagram" | "direct" | "other",
  "space_name": "string (e.g. The Void, The Mirage, Bangri, The Chamber, South Delhi Sanctuary, or generic Nothingness Space)",
  "reservation_code": "string or null",
  "check_in": "YYYY-MM-DD or estimated past date",
  "check_out": "YYYY-MM-DD or estimated past date",
  "total_price": number or null,
  "primary_guest_name": "string or null",
  "primary_guest_phone": "string or null",
  "primary_guest_id_number": "string or null",
  "co_guests": [
    {
      "name": "Full Name",
      "phone": "Phone number or null",
      "document_number": "Govt ID / Aadhaar / Passport number or null",
      "document_type": "Aadhaar" | "Passport" | "Other" | null
    }
  ],
  "reason": "Brief human readable explanation of why this proof was validated or rejected"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: promptText }
          ]
        }
      ]
    });

    const responseText = response.text || '{}';
    let parsed: any = {};
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini stay verification response:', responseText);
      return NextResponse.json(
        { error: 'Optical verification parser error. Please ensure the screenshots are clear and legible.' },
        { status: 500 }
      );
    }

    if (!parsed.is_valid_booking_proof || (parsed.confidence_score !== undefined && parsed.confidence_score < 40)) {
      return NextResponse.json(
        {
          verified: false,
          error: parsed.reason || 'We could not verify a valid previous Nothingness reservation from the uploaded screenshots. Please upload an Airbnb/MMT receipt or your WhatsApp booking chat.'
        },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Resolve matching Space from Nothingness spaces table
    let matchedSpaceId: string | null = null;
    const { data: spaces } = await adminSupabase.from('spaces').select('id, title, slug');
    if (spaces && spaces.length > 0) {
      if (parsed.space_name) {
        const lowerName = parsed.space_name.toLowerCase();
        const found = spaces.find(s => 
          lowerName.includes(s.title.toLowerCase()) || 
          lowerName.includes(s.slug.toLowerCase())
        );
        if (found) matchedSpaceId = found.id;
      }
      if (!matchedSpaceId) {
        matchedSpaceId = spaces[0].id; // Fallback to primary sanctuary
      }
    }

    // 2. Prepare Check-in & Check-out dates (fallback to realistic past dates if unformatted)
    const today = new Date();
    const fallbackCheckIn = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fallbackCheckOut = new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const finalCheckIn = parsed.check_in && /^\d{4}-\d{2}-\d{2}$/.test(parsed.check_in) ? parsed.check_in : fallbackCheckIn;
    const finalCheckOut = parsed.check_out && /^\d{4}-\d{2}-\d{2}$/.test(parsed.check_out) ? parsed.check_out : fallbackCheckOut;

    // 3. Look up or create primary guest profile for current user
    let userPhone = user.phone ? user.phone.replace(/[^0-9+]/g, '') : null;
    let userFullName = user.user_metadata?.full_name || parsed.primary_guest_name || 'Nothingness Member';

    let primaryGuestProfileId: string | null = null;
    if (userPhone) {
      const { data: existingGp } = await adminSupabase
        .from('guest_profiles')
        .select('id, full_name')
        .eq('phone', userPhone)
        .maybeSingle();
      if (existingGp) {
        primaryGuestProfileId = existingGp.id;
        userFullName = existingGp.full_name || userFullName;
      }
    }

    if (!primaryGuestProfileId) {
      const { data: existingGpByUid } = await adminSupabase
        .from('guest_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingGpByUid) {
        primaryGuestProfileId = existingGpByUid.id;
        userFullName = existingGpByUid.full_name || userFullName;
      }
    }

    const totalGuestsCount = 1 + (Array.isArray(parsed.co_guests) ? parsed.co_guests.length : 0);

    // 4. Create verified booking record in Nothingness database
    const { data: newBooking, error: bookingError } = await adminSupabase
      .from('bookings')
      .insert({
        space_id: matchedSpaceId,
        user_id: user.id,
        check_in: finalCheckIn,
        check_out: finalCheckOut,
        guests: totalGuestsCount,
        total_price: parsed.total_price || 35000,
        status: 'confirmed',
        platform: parsed.platform || 'direct',
        guest_name: userFullName,
        guest_phone: userPhone || parsed.primary_guest_phone || null,
        guest_email: user.email || null,
        is_screenshot_verified: true,
        extracted_metadata: parsed,
        proof_screenshots: screenshots.map((_: string, idx: number) => `screenshot_proof_${idx + 1}_${Date.now()}`)
      })
      .select()
      .single();

    if (bookingError || !newBooking) {
      console.error('Error creating verified booking from stay proof:', bookingError);
      return NextResponse.json({ error: 'Failed to record verified booking in system.' }, { status: 500 });
    }

    // 5. Link primary guest into booking_guests
    if (primaryGuestProfileId) {
      await adminSupabase.from('booking_guests').insert({
        booking_id: newBooking.id,
        guest_index: 0,
        name: userFullName,
        verification_status: 'verified',
        guest_profile_id: primaryGuestProfileId
      });
    }

    // 6. Cross-Guest Identification & Pre-Storing Engine (Strict Confidentiality)
    let matchedExistingCoGuests = 0;
    let prestoredNewCoGuests = 0;
    const coGuestsSummary: Array<{ name: string; status: string }> = [];

    if (Array.isArray(parsed.co_guests) && parsed.co_guests.length > 0) {
      for (let i = 0; i < parsed.co_guests.length; i++) {
        const coGuest = parsed.co_guests[i];
        if (!coGuest.name) continue;

        let coGuestProfileId: string | null = null;
        let isPrestored = false;

        // A. Search by Govt ID number if provided
        if (coGuest.document_number) {
          const cleanDoc = coGuest.document_number.trim().toUpperCase();
          const { data: matchedByDoc } = await adminSupabase
            .from('guest_profiles')
            .select('id, full_name')
            .eq('document_number', cleanDoc)
            .maybeSingle();

          if (matchedByDoc) {
            coGuestProfileId = matchedByDoc.id;
            matchedExistingCoGuests++;
            coGuestsSummary.push({ name: coGuest.name, status: 'Identified discreetly from database records' });
          }
        }

        // B. Search by Phone if provided
        if (!coGuestProfileId && coGuest.phone) {
          const cleanPhone = coGuest.phone.replace(/[^0-9+]/g, '');
          const { data: matchedByPhone } = await adminSupabase
            .from('guest_profiles')
            .select('id, full_name')
            .eq('phone', cleanPhone)
            .maybeSingle();

          if (matchedByPhone) {
            coGuestProfileId = matchedByPhone.id;
            matchedExistingCoGuests++;
            coGuestsSummary.push({ name: coGuest.name, status: 'Identified discreetly from database records' });
          }
        }

        // C. If NOT found in DB, pre-store shadow profile for future signups / bookings
        if (!coGuestProfileId && (coGuest.document_number || coGuest.phone || coGuest.name)) {
          const { data: prestoredProfile, error: preError } = await adminSupabase
            .from('guest_profiles')
            .insert({
              full_name: coGuest.name,
              phone: coGuest.phone ? coGuest.phone.replace(/[^0-9+]/g, '') : null,
              document_number: coGuest.document_number ? coGuest.document_number.trim().toUpperCase() : null,
              id_document_type: coGuest.document_type || 'Aadhaar',
              is_verified: !!coGuest.document_number,
              is_prestored: true,
              prestored_from_booking_id: newBooking.id,
              prestored_metadata: {
                source: 'kinkster_multi_screenshot_verification',
                extracted_at: new Date().toISOString(),
                verified_by_user: user.id
              }
            })
            .select('id')
            .single();

          if (!preError && prestoredProfile) {
            coGuestProfileId = prestoredProfile.id;
            prestoredNewCoGuests++;
            isPrestored = true;
            coGuestsSummary.push({ name: coGuest.name, status: 'Pre-stored for automatic recognition in future' });
          }
        }

        // Link co-guest to booking_guests quietly (zero external notifications)
        await adminSupabase.from('booking_guests').insert({
          booking_id: newBooking.id,
          guest_index: i + 1,
          name: coGuest.name,
          verification_status: isPrestored || coGuestProfileId ? 'verified' : 'pending',
          guest_profile_id: coGuestProfileId
        });
      }
    }

    // 7. Update User's Kinkster Profile: mark stay_verified = true
    const verificationPayload = {
      booking_id: newBooking.id,
      platform: parsed.platform || 'direct',
      space_name: parsed.space_name || 'Nothingness Sanctuary',
      check_in: finalCheckIn,
      check_out: finalCheckOut,
      reservation_code: parsed.reservation_code || null,
      co_guests_count: parsed.co_guests?.length || 0,
      matched_existing_co_guests: matchedExistingCoGuests,
      prestored_new_co_guests: prestoredNewCoGuests,
      screenshots_count: screenshots.length,
      verified_at: new Date().toISOString()
    };

    await adminSupabase
      .from('kinkster_profiles')
      .upsert({
        id: user.id,
        stay_verified: true,
        stay_verification_source: 'screenshot_ai',
        stay_verification_data: verificationPayload,
        stay_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      verified: true,
      booking_id: newBooking.id,
      extracted: {
        platform: parsed.platform || 'direct',
        space_name: parsed.space_name || 'Nothingness Sanctuary',
        check_in: finalCheckIn,
        check_out: finalCheckOut,
        reservation_code: parsed.reservation_code,
        primary_guest_name: userFullName,
        co_guests: coGuestsSummary
      },
      identity_resolution: {
        total_co_guests: parsed.co_guests?.length || 0,
        matched_existing: matchedExistingCoGuests,
        prestored_new: prestoredNewCoGuests
      },
      message: `Previous stay verified! Confirmed stay at ${parsed.space_name || 'Nothingness Sanctuary'} recorded in database. Kinkster Stay Requirement unlocked.`
    });

  } catch (err: any) {
    console.error('Stay verification exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during stay verification' }, { status: 500 });
  }
}
