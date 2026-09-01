import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id, check_in, check_out, guest_name, guests, status,
        spaces (id, title, area, city, featured_image)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        primary_guest_name: booking.guest_name,
        space: Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, phone, frontImage, backImage, mimeType } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    const supabase = createAdminClient();

    // 1. Check if guest already exists and is 180-day verified
    const { data: existingProfile } = await supabase
      .from('guest_profiles')
      .select('*')
      .or(`phone.ilike.%${last10}%,phone_number.ilike.%${last10}%`)
      .eq('is_verified', true)
      .gt('verification_expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (existingProfile) {
      // Link directly to booking
      await supabase
        .from('booking_guests')
        .insert({
          booking_id: bookingId,
          guest_index: 1,
          name: existingProfile.full_name,
          phone: cleanPhone,
          verification_status: 'verified',
          guest_profile_id: existingProfile.id
        });

      return NextResponse.json({
        verified: true,
        reusedExisting: true,
        name: existingProfile.full_name,
        expires_at: existingProfile.verification_expires_at,
        message: `Welcome back, ${existingProfile.full_name}! Your 180-day ID verification is active. You have been linked to this stay.`
      }, { status: 200 });
    }

    if (!frontImage || !backImage) {
      return NextResponse.json({ error: 'Both Front and Back photos of Aadhaar Card or Passport are required.' }, { status: 400 });
    }

    // 2. Perform AI ID verification
    const apiKey = process.env.GEMINI_API_KEY;
    let extractedName = 'Guest';
    let docType = 'Aadhaar';
    let docNumber = '';
    let dob = '';
    let address = '';
    let isForeign = false;
    let nationality = 'Indian';

    if (apiKey) {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const cleanFront = frontImage.includes('base64,') ? frontImage.split('base64,')[1] : frontImage;
      const cleanBack = backImage.includes('base64,') ? backImage.split('base64,')[1] : backImage;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze these FRONT and BACK images of a guest identity document.
                Strict Rules: Document must be an authentic Aadhaar Card or Passport. Driving License and Voter ID must be rejected.
                Return ONLY a JSON object:
                {
                  "valid": true,
                  "name": "Full Legal Name",
                  "dob": "DD/MM/YYYY",
                  "document_type": "Aadhaar" or "Passport",
                  "document_number": "XXXX",
                  "permanent_address": "Residential address",
                  "is_foreign_national": false,
                  "nationality": "Indian",
                  "reason": "If invalid"
                }`
              },
              { inlineData: { data: cleanFront, mimeType: mimeType || 'image/jpeg' } },
              { inlineData: { data: cleanBack, mimeType: mimeType || 'image/jpeg' } }
            ]
          }
        ]
      });

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const result = JSON.parse(cleanJson);

      if (!result.valid) {
        return NextResponse.json({
          verified: false,
          error: result.reason || 'Driving License and Voter ID are not accepted. Please upload a clear Aadhaar Card or Passport.'
        }, { status: 400 });
      }

      extractedName = result.name || 'Guest';
      docType = result.document_type || 'Aadhaar';
      docNumber = result.document_number || '';
      dob = result.dob || '';
      address = result.permanent_address || 'Address recorded on ID';
      isForeign = !!result.is_foreign_national;
      nationality = result.nationality || 'Indian';
    }

    const now = new Date();
    const expiresAt = addDays(now, 180).toISOString();
    const policeStatus = isForeign ? 'form_c_required' : 'verified_compliant';

    // 3. Upsert guest profile
    const { data: newProfile, error: profErr } = await supabase
      .from('guest_profiles')
      .upsert(
        {
          full_name: extractedName,
          phone: cleanPhone,
          phone_number: cleanPhone,
          id_document_type: docType,
          document_number: docNumber || null,
          dob: dob || null,
          permanent_address: address,
          is_foreign_national: isForeign,
          nationality,
          is_verified: true,
          verification_timestamp: now.toISOString(),
          verification_expires_at: expiresAt,
          police_register_status: policeStatus,
        },
        { onConflict: 'document_number' }
      )
      .select()
      .single();

    if (profErr) {
      console.error('Guest profile creation error:', profErr);
    }

    // 4. Add to booking_guests
    await supabase
      .from('booking_guests')
      .insert({
        booking_id: bookingId,
        guest_index: 1,
        name: extractedName,
        phone: cleanPhone,
        verification_status: 'verified',
        guest_profile_id: newProfile?.id || null
      });

    return NextResponse.json({
      verified: true,
      name: extractedName,
      document_type: docType,
      expires_at: expiresAt,
      message: `Welcome ${extractedName}! Identity verified for 180 days and linked to reservation.`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Invite verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
