import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { traceSpan, recordScoutError } from '@/lib/monitoring/scout';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      screenshots,
      platform: userPlatform,
      confirmedCode,
      confirmedCheckIn,
      confirmedCheckOut,
      confirmedSpaceId,
      primaryName,
    } = body;

    const adminSupabase = createAdminClient();

    // 1. Fetch available sanctuary spaces for matching
    const { data: spaces } = await adminSupabase
      .from('spaces')
      .select('id, title, slug, city, area')
      .eq('active', true);

    const availableSpaces = spaces || [];
    const defaultSpace = availableSpaces[0] || { id: null, title: 'Nothingness Sanctuary' };

    let reservationCode = confirmedCode ? String(confirmedCode).trim() : '';
    let checkIn = confirmedCheckIn || '';
    let checkOut = confirmedCheckOut || '';
    let detectedPlatform = userPlatform || 'airbnb';
    let matchedSpaceId = confirmedSpaceId || null;
    let primaryGuestName = primaryName || '';
    let guestsCount = 2;
    let confidenceScore = 100;
    let rawAiText = '';

    // 2. Optical AI Vision Extraction if screenshots are provided and not already confirmed
    if (screenshots && Array.isArray(screenshots) && screenshots.length > 0 && (!reservationCode || !checkIn)) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });

          const imageParts = screenshots.slice(0, 3).map((item: string) => {
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
                mimeType,
              },
            };
          });

          const prompt = `Analyze these screenshot image(s) of a travel booking reservation (Airbnb, MakeMyTrip, Agoda, Booking.com, or direct concierge chat).
Extract the following key reservation parameters with high precision:
- Reservation Number / Confirmation Code (e.g. Airbnb code like HM8XXXXXX, MMT ID like NNXXXX, Booking.com confirmation number, or Agoda booking ID).
- Check-in Date (YYYY-MM-DD).
- Check-out Date (YYYY-MM-DD).
- Platform name: "airbnb" | "makemytrip" | "agoda" | "booking.com" | "direct".
- Space / Listing Title (look for keywords like "The Chamber", "The Void", "Nothingness", "Bangri", "Delhi").
- Primary guest name if visible.
- Total guests count.

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "valid_screenshot": boolean,
  "confidence_score": number, // 0 to 100
  "reservation_code": "string or null",
  "check_in": "YYYY-MM-DD or null",
  "check_out": "YYYY-MM-DD or null",
  "platform": "airbnb" | "makemytrip" | "agoda" | "booking.com" | "direct",
  "space_name": "string or null",
  "primary_guest_name": "string or null",
  "guests_count": number,
  "notes": "brief string"
}`;

          const response = await traceSpan(
            'AI',
            'gemini_screenshot_parsing',
            async () => {
              return await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                  {
                    role: 'user',
                    parts: [...imageParts, { text: prompt }],
                  },
                ],
              });
            },
            { platform: detectedPlatform, imageCount: imageParts.length }
          );

          rawAiText = response.text || '{}';
          const cleanJson = rawAiText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed.reservation_code) {
            reservationCode = parsed.reservation_code.trim();
          }
          if (parsed.check_in) {
            checkIn = parsed.check_in;
          }
          if (parsed.check_out) {
            checkOut = parsed.check_out;
          }
          if (parsed.platform) {
            detectedPlatform = parsed.platform.toLowerCase();
          }
          if (parsed.primary_guest_name && !primaryGuestName) {
            primaryGuestName = parsed.primary_guest_name;
          }
          if (parsed.guests_count) {
            guestsCount = parsed.guests_count;
          }
          if (parsed.confidence_score) {
            confidenceScore = parsed.confidence_score;
          }

          // Match Space Name from AI output
          if (parsed.space_name && availableSpaces.length > 0) {
            const lowerAiSpace = parsed.space_name.toLowerCase();
            const matched = availableSpaces.find(
              (s) =>
                lowerAiSpace.includes(s.title.toLowerCase()) ||
                lowerAiSpace.includes(s.slug.toLowerCase())
            );
            if (matched) matchedSpaceId = matched.id;
          }
        } catch (aiErr: any) {
          console.warn('[Verify Screenshot API] Gemini OCR note:', aiErr?.message || aiErr);
        }
      }
    }

    // Default space fallback
    if (!matchedSpaceId && availableSpaces.length > 0) {
      matchedSpaceId = defaultSpace.id;
    }

    // Failproof Gate: If reservation code or dates couldn't be extracted,
    // return partial extraction to allow the user to confirm/edit with zero friction
    if (!reservationCode || !checkIn) {
      return NextResponse.json({
        success: false,
        requires_manual_confirmation: true,
        extracted: {
          reservation_code: reservationCode || null,
          check_in: checkIn || null,
          check_out: checkOut || null,
          platform: detectedPlatform,
          space_id: matchedSpaceId,
          primary_guest_name: primaryGuestName || null,
        },
        available_spaces: availableSpaces,
        message: 'Please confirm your reservation number and dates below.',
      });
    }

    // Calculate fallback check_out if check_in exists but check_out was not parsed
    if (checkIn && !checkOut) {
      const cIn = new Date(checkIn);
      const cOut = new Date(cIn.getTime() + 24 * 60 * 60 * 1000);
      checkOut = cOut.toISOString().split('T')[0];
    }

    const userPhone = user?.phone || user?.user_metadata?.phone || null;
    const cleanUserPhone = userPhone ? userPhone.replace(/[^0-9]/g, '') : null;

    // 3. Check if a booking matching this reservation code already exists
    let existingBooking: any = null;
    const { data: foundBookings } = await adminSupabase
      .from('bookings')
      .select('*, spaces(id, title, city, area)')
      .or(`transaction_id.eq.${reservationCode},payment_order_id.eq.${reservationCode}`)
      .limit(1);

    if (foundBookings && foundBookings.length > 0) {
      existingBooking = foundBookings[0];
      // Associate with current user if not already linked
      if (user?.id && !existingBooking.user_id) {
        await adminSupabase
          .from('bookings')
          .update({ user_id: user.id })
          .eq('id', existingBooking.id);
      }
    }

    let activeBookingId = existingBooking?.id;
    let selectedSpace = existingBooking?.spaces || availableSpaces.find((s) => s.id === matchedSpaceId) || defaultSpace;

    // 4. Create new Booking record if none existed
    if (!activeBookingId) {
      const newBookingPayload = {
        space_id: matchedSpaceId,
        user_id: user?.id || null,
        check_in: checkIn,
        check_out: checkOut,
        guests: Math.max(2, guestsCount),
        total_price: 0, // Already settled on OTA
        status: 'confirmed',
        payment_order_id: reservationCode,
        transaction_id: reservationCode,
        guest_name: primaryGuestName || userPhone || 'Sanctuary Guest',
        guest_phone: userPhone,
        special_requests: `Verified via ${detectedPlatform.toUpperCase()} Screenshot (${reservationCode})`,
      };

      const { data: createdBooking, error: insertBookingErr } = await adminSupabase
        .from('bookings')
        .insert(newBookingPayload)
        .select('*, spaces(id, title, city, area)')
        .single();

      if (insertBookingErr || !createdBooking) {
        console.error('[Verify Screenshot API] Error inserting booking:', insertBookingErr);
        return NextResponse.json(
          { error: 'Could not create reservation check-in ledger. Please try again.' },
          { status: 500 }
        );
      }

      activeBookingId = createdBooking.id;
      selectedSpace = createdBooking.spaces || selectedSpace;
    }

    // 5. Ensure primary and co-guest records exist in booking_guests
    const { data: existingGuests } = await adminSupabase
      .from('booking_guests')
      .select('*')
      .eq('booking_id', activeBookingId)
      .order('guest_index', { ascending: true });

    let primaryGuestRecord = existingGuests?.find((g) => g.guest_index === 0);
    let coGuestRecord = existingGuests?.find((g) => g.guest_index === 1);

    // Auto-check if primary user is already 180-day verified in guest_profiles
    let primaryIsVerified = false;
    let linkedProfileId: string | null = null;

    if (cleanUserPhone) {
      const { data: prof } = await adminSupabase
        .from('guest_profiles')
        .select('id, full_name, is_verified, verification_expires_at')
        .or(`phone.ilike.%${cleanUserPhone.slice(-10)}%,phone_number.ilike.%${cleanUserPhone.slice(-10)}%`)
        .eq('is_verified', true)
        .gt('verification_expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (prof) {
        primaryIsVerified = true;
        linkedProfileId = prof.id;
        if (!primaryGuestName && prof.full_name) {
          primaryGuestName = prof.full_name;
        }
      }
    }

    if (!primaryGuestRecord) {
      const { data: newPrimary } = await adminSupabase
        .from('booking_guests')
        .insert({
          booking_id: activeBookingId,
          guest_index: 0,
          name: primaryGuestName || userPhone || 'Primary Guest',
          phone: userPhone,
          is_primary: true,
          verification_status: primaryIsVerified ? 'verified' : 'pending',
          verification_token: crypto.randomUUID(),
          guest_profile_id: linkedProfileId,
        })
        .select()
        .single();
      primaryGuestRecord = newPrimary;
    }

    if (!coGuestRecord) {
      const coGuestToken = crypto.randomUUID();
      const { data: newCoGuest } = await adminSupabase
        .from('booking_guests')
        .insert({
          booking_id: activeBookingId,
          guest_index: 1,
          name: null,
          phone: null,
          is_primary: false,
          verification_status: 'pending',
          verification_token: coGuestToken,
        })
        .select()
        .single();
      coGuestRecord = newCoGuest;
    }

    // 6. Build Deep-link & WhatsApp Invite Payload
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (req.headers.get('host')?.includes('localhost')
        ? `http://${req.headers.get('host')}`
        : 'https://nothingness.asia');

    const coGuestInviteUrl = `${siteUrl}/verify-guest/invite?booking=${activeBookingId}`;
    const spaceTitle = selectedSpace?.title || 'Nothingness Sanctuary';
    const waText = `Namaste! ✨ Please complete your 30-second digital ID check-in for our upcoming stay at Nothingness (${spaceTitle}):\n${coGuestInviteUrl}`;
    const waShareUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

    return NextResponse.json({
      success: true,
      booking_id: activeBookingId,
      reservation_code: reservationCode,
      platform: detectedPlatform,
      check_in: checkIn,
      check_out: checkOut,
      space: selectedSpace,
      primary_guest: {
        id: primaryGuestRecord?.id,
        name: primaryGuestName || primaryGuestRecord?.name,
        is_verified: primaryIsVerified || primaryGuestRecord?.verification_status === 'verified',
        token: primaryGuestRecord?.verification_token,
      },
      co_guest: {
        id: coGuestRecord?.id,
        is_verified: coGuestRecord?.verification_status === 'verified',
        token: coGuestRecord?.verification_token,
      },
      co_guest_invite_url: coGuestInviteUrl,
      whatsapp_share_url: waShareUrl,
      message: `Reservation ${reservationCode} successfully linked to your profile!`,
    });
  } catch (error: any) {
    console.error('[Verify Screenshot API] Server error:', error);
    recordScoutError(error, {
      endpoint: '/api/bookings/verify-screenshot',
    });
    return NextResponse.json(
      { error: error.message || 'Failed to verify reservation screenshot.' },
      { status: 500 }
    );
  }
}
