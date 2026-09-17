import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { traceSpan, recordScoutError } from '@/lib/monitoring/scout';
import crypto from 'crypto';
import { getGeminiApiKey } from '@/lib/ai/gemini-client';
import { detectGovernmentIdMarkers } from '@/lib/id-utils';

function normalizeDateToIso(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

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
    let hasValidVoucherScreenshot = false;

    // 2. Optical AI Vision Extraction if screenshots are provided and not already confirmed
    if (screenshots && Array.isArray(screenshots) && screenshots.length > 0 && (!reservationCode || !checkIn)) {
      const apiKey = await getGeminiApiKey();
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

          const prompt = `You are the automated booking verification gatekeeper for "Nothingness" luxury sanctuaries and suites.
Thoroughly inspect the uploaded image(s) to verify whether this is an authentic travel accommodation booking confirmation or reservation voucher.

CRITICAL DOCUMENT CLASSIFICATION:
1. Is this image an authentic booking reservation confirmation, itinerary, or voucher from Airbnb, MakeMyTrip, Agoda, Booking.com, Goibibo, or direct host messaging?
2. If the image is:
   - A government ID card (Aadhaar Card, Passport, Driving License, PAN card, Voter ID, etc.) - (Note: IDs belong to statutory guest check-in & police verification, NOT booking confirmation)
   - A photo of a human face, portrait, selfie, or person without booking confirmation context
   - A photo of random objects, food, pets, landscapes, nature, or vehicles
   - A social media screenshot, meme, or non-booking content
   THEN IT IS STRICTLY INVALID. Set:
   "valid_screenshot": false,
   "is_booking_document": false,
   "confidence_score": 0,
   "document_type": "government_id" | "human_portrait" | "random_image",
   "rejection_reason": "Government ID detected (Aadhaar/Passport/DL). This step requires an accommodation booking voucher from Airbnb, MakeMyTrip, Agoda, or Booking.com. ID verification is completed during guest check-in." (for IDs) or "The uploaded photo is not a valid booking confirmation. It appears to be a personal photo/unrelated image. Please upload an official reservation screenshot from Airbnb, MakeMyTrip, Agoda, or Booking.com."

3. If this IS a genuine travel reservation confirmation / voucher:
   Set:
   "valid_screenshot": true,
   "is_booking_document": true,
   "confidence_score": 85,
   "document_type": "reservation_voucher",
   "platform": "airbnb" | "makemytrip" | "agoda" | "booking.com" | "direct",
   "reservation_code": "exact confirmation/booking ID (e.g. HM8X7Y9Z, 12345678, etc.)",
   "check_in": "YYYY-MM-DD",
   "check_out": "YYYY-MM-DD",
   "space_name": "name of sanctuary or listing (e.g. The Chamber, The Void, Nothingness, Delhi)",
   "primary_guest_name": "Full name of guest if visible",
   "guests_count": 2,
   "notes": "brief notes"

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "valid_screenshot": boolean,
  "is_booking_document": boolean,
  "confidence_score": number,
  "document_type": string,
  "rejection_reason": string or null,
  "reservation_code": string or null,
  "check_in": string or null,
  "check_out": string or null,
  "platform": "airbnb" | "makemytrip" | "agoda" | "booking.com" | "direct",
  "space_name": string or null,
  "primary_guest_name": string or null,
  "guests_count": number,
  "notes": string
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

          const isGovId =
            parsed.document_type === 'government_id' ||
            parsed.document_type === 'aadhaar' ||
            parsed.document_type === 'passport' ||
            parsed.document_type === 'id_card' ||
            (parsed.rejection_reason && /Aadhaar|Passport|Government ID|ID card|Driving Licence|PAN card/i.test(parsed.rejection_reason));

          // STRICT GATE: Reject non-reservation images (Government IDs, selfies, random images)
          if (
            parsed.valid_screenshot === false ||
            parsed.is_booking_document === false ||
            (parsed.confidence_score !== undefined && parsed.confidence_score < 30) ||
            parsed.document_type !== 'reservation_voucher' ||
            isGovId
          ) {
            return NextResponse.json(
              {
                success: false,
                is_invalid_document: true,
                is_government_id: Boolean(isGovId),
                error:
                  isGovId
                    ? 'Government ID detected (Aadhaar/Passport/DL). This step requires an accommodation booking voucher from Airbnb, MakeMyTrip, Agoda, or Booking.com. ID verification is completed during guest check-in.'
                    : (parsed.rejection_reason || 'The uploaded photo does not appear to be a valid booking confirmation. Please upload an official reservation screenshot from Airbnb, MakeMyTrip, Agoda, or Booking.com.'),
                document_type: parsed.document_type || (isGovId ? 'government_id' : 'unrelated'),
              },
              { status: 400 }
            );
          }

          hasValidVoucherScreenshot = true;

          if (parsed.reservation_code) {
            reservationCode = String(parsed.reservation_code).trim();
          }
          if (parsed.check_in) {
            checkIn = normalizeDateToIso(parsed.check_in) || parsed.check_in;
          }
          if (parsed.check_out) {
            checkOut = normalizeDateToIso(parsed.check_out) || parsed.check_out;
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

      // If Gemini was unavailable or errored, run local OCR check for Government IDs
      if (!hasValidVoucherScreenshot) {
        try {
          const { extractDocumentWithLocalOcr } = await import('@/lib/ai/ocr-fallback');
          const cleanImages = screenshots.map((item: string) =>
            item.includes('base64,') ? item.split('base64,')[1] : item
          );
          const ocrRes = await extractDocumentWithLocalOcr(cleanImages);
          if (ocrRes.success && ocrRes.extracted) {
            const markerCheck = detectGovernmentIdMarkers(
              `${ocrRes.extracted.name} ${ocrRes.extracted.document_number} ${ocrRes.extracted.permanent_address}`
            );
            if (markerCheck.isGovernmentId || ocrRes.extracted.document_type) {
              return NextResponse.json(
                {
                  success: false,
                  is_invalid_document: true,
                  is_government_id: true,
                  error:
                    'Government ID detected (Aadhaar/Passport/DL). This step requires an accommodation booking voucher from Airbnb, MakeMyTrip, Agoda, or Booking.com. ID verification is completed during guest check-in.',
                  document_type: 'government_id',
                },
                { status: 400 }
              );
            }
          }
        } catch (localOcrErr) {
          console.warn('[Verify Screenshot API] Local OCR check note:', localOcrErr);
        }
      }

      // Any uploaded image that could not be authenticated as a genuine booking voucher MUST be rejected
      if (!hasValidVoucherScreenshot) {
        return NextResponse.json(
          {
            success: false,
            is_invalid_document: true,
            error:
              'Could not detect an accommodation booking voucher in the uploaded image. Please upload an official reservation screenshot from Airbnb, MakeMyTrip, Agoda, or Booking.com.',
            document_type: 'unknown',
          },
          { status: 400 }
        );
      }
    }

    // Default space fallback
    if (!matchedSpaceId && availableSpaces.length > 0) {
      matchedSpaceId = defaultSpace.id;
    }

    // Failproof Gate: If reservation code or dates couldn't be extracted from manual entry,
    // prompt user to confirm/fill required fields
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
      const isAuditedScreenshot = hasValidVoucherScreenshot;
      const newBookingPayload = {
        space_id: matchedSpaceId,
        user_id: user?.id || null,
        check_in: checkIn,
        check_out: checkOut,
        guests: Math.max(2, guestsCount),
        total_price: 0, // Already settled on OTA
        status: isAuditedScreenshot ? 'confirmed' : 'pending',
        payment_order_id: reservationCode,
        transaction_id: reservationCode,
        guest_name: primaryGuestName || userPhone || 'Sanctuary Guest',
        guest_phone: userPhone,
        special_requests: isAuditedScreenshot
          ? `Verified via ${detectedPlatform.toUpperCase()} Screenshot (${reservationCode})`
          : `Manual reservation code submitted (${detectedPlatform.toUpperCase()}: ${reservationCode}) - pending host audit`,
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

    if (user?.id && primaryGuestName) {
      try {
        await adminSupabase
          .from('guest_profiles')
          .update({ full_name: primaryGuestName })
          .eq('user_id', user.id)
          .is('full_name', null);
      } catch (profUpdateErr) {
        console.warn('[Verify Screenshot API] Guest profile name update notice:', profUpdateErr);
      }
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
