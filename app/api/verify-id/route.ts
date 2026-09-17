import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationApprovedNotification } from '@/lib/notifications/verification';
import { getPlatformActionFees, createPayUPaymentRequestAsync } from '@/lib/payu';
import { traceSpan, recordScoutError } from '@/lib/monitoring/scout';
import { addDays } from 'date-fns';
import crypto from 'crypto';
import { getGeminiApiKey } from '@/lib/ai/gemini-client';
import {
  extractDetailsFromText,
  formatAadhaarNumber,
  validateAadhaarNumber,
  validatePassportNumber,
  calculateAge,
  detectGovernmentIdMarkers,
} from '@/lib/id-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function uploadBase64ToStorage(
  adminSupabase: any,
  base64Data: string,
  filePath: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  try {
    const clean = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    const buffer = Buffer.from(clean, 'base64');
    const { error } = await adminSupabase.storage
      .from('guest-ids')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Storage Upload Failed] ${filePath}:`, error.message);
      return null;
    }

    const { data } = adminSupabase.storage.from('guest-ids').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err: any) {
    console.warn(`[Storage Upload Error] ${filePath}:`, err?.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      bookingId, guestId, token, phone, frontImage, backImage, images, mimeType,
      fullName: clientName, documentNumber: clientDocNumber, documentType: clientDocType,
      dob: clientDob, permanentAddress: clientAddress, photoBase64, scanOnly
    } = body;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 0. Resolve active session user if logged in
    const { data: { user } } = await supabase.auth.getUser();
    const isSyntheticEmail = Boolean(user?.email && user.email.includes('@auth.nothingness'));
    const sessionPhone = user?.phone 
      ? user.phone.replace(/[^0-9+]/g, '') 
      : isSyntheticEmail && user?.email 
      ? user.email.split('@')[0].replace(/[^0-9+]/g, '') 
      : null;
    const sessionUserId = user?.id || null;
    const sessionEmail = user?.email || null;

    // Enforce authentication for standalone / lifestyle ID verifications
    if (!token && !bookingId && !sessionUserId && !scanOnly) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Authentication Required: Please sign in with Mobile OTP to verify your ID and link it to your account.',
        },
        { status: 401 }
      );
    }

    const effectivePhone = phone
      ? phone.replace(/[^0-9+]/g, '')
      : sessionPhone;

    // 1. If not scanOnly, check if guest is already verified by phone number within 180 days
    if (!scanOnly && effectivePhone) {
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
            .or(`verification_token.eq.${token},id.eq.${token}`);
        }

        let targetBookingId: string | null = bookingId || null;
        if (!targetBookingId && token) {
          const { data: bgRecord } = await adminSupabase
            .from('booking_guests')
            .select('booking_id')
            .or(`verification_token.eq.${token},id.eq.${token}`)
            .maybeSingle();
          if (bgRecord?.booking_id) targetBookingId = bgRecord.booking_id;
        }

        if (targetBookingId) {
          try {
            const { checkAndDispatchStage2IfAllGuestsVerified } = await import('@/lib/chat/guest-journey');
            await checkAndDispatchStage2IfAllGuestsVerified(targetBookingId);
          } catch (stage2Err) {
            console.warn('[Verify ID] Stage 2 auto-dispatch error:', stage2Err);
          }
        }

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
            document_number: existingProfile.document_number,
            photo_url: existingProfile.photo_url,
            id_front_url: existingProfile.id_front_url,
            expires_at: existingProfile.verification_expires_at,
            message: `Welcome back ${existingProfile.full_name}! Your ID verification is valid for 180 days.`,
          },
          { status: 200 }
        );
      }
    }

    // Collect uploaded image(s)
    const rawImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      rawImages.push(...images.filter(Boolean));
    } else {
      if (frontImage) rawImages.push(frontImage);
      if (backImage) rawImages.push(backImage);
    }

    if (rawImages.length === 0) {
      return NextResponse.json(
        { error: 'Please upload a clear photo of your Aadhaar Card or Passport.' },
        { status: 400 }
      );
    }

    const cleanImages = rawImages.map((img) =>
      img.includes('base64,') ? img.split('base64,')[1] : img
    );
    const imageMimeType = mimeType || 'image/jpeg';

    // 2. Multimodal AI Extraction (NVIDIA NIM, Google Gemini, or Local OCR Fallback)
    let extractedData: {
      valid?: boolean;
      name?: string;
      document_type?: string;
      document_number?: string;
      dob?: string;
      permanent_address?: string;
      above18?: boolean;
      is_foreign_national?: boolean;
      nationality?: string;
      reason?: string;
    } = {};

    let visionSucceeded = false;

    // Load keys from environment or Supabase platform_settings
    let nvidiaKey =
      process.env.NVIDIA_API_KEY ||
      process.env.nVidia_AI_API_Key ||
      process.env.NVIDIA_AI_API_KEY ||
      process.env.NV_API_KEY ||
      null;

    let geminiKey = await getGeminiApiKey();

    // Helper to extract JSON from raw model text (with or without markdown fences)
    const extractJsonFromText = (text: string): any => {
      if (!text) return null;
      const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(clean);
      } catch {}

      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          const candidate = text.slice(firstBrace, lastBrace + 1);
          return JSON.parse(candidate);
        } catch {}
      }
      return null;
    };

    // A. NVIDIA Multimodal Vision AI
    if (nvidiaKey) {
      try {
        const { extractDocumentWithNvidiaVision } = await import('@/lib/ai/nvidia');
        const nvidiaResult = await extractDocumentWithNvidiaVision({
          images: cleanImages,
          mimeType: imageMimeType,
          apiKey: nvidiaKey,
        });

        if (nvidiaResult.success && nvidiaResult.extracted) {
          extractedData = { ...nvidiaResult.extracted };
          visionSucceeded = true;
        }
      } catch (nvidiaErr: any) {
        console.warn('[Verify ID] NVIDIA Vision error:', nvidiaErr?.message);
      }
    }

    // B. Google Gemini Vision Fallback
    if (!visionSucceeded && geminiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        const prompt = `You are an authoritative government ID verification system for "Nothingness" luxury retreats (statutory police compliance & guest check-in).
Analyze the uploaded image(s) of the guest's Indian Aadhaar Card or Passport.

DOCUMENT CLASSIFICATION:
1. Is this image a genuine Indian Aadhaar Card (front or back) or Passport (photo/data page)?
2. If the image is:
   - A random selfie or portrait photo of a human without an ID card
   - A photo of animals, food, scenery, vehicles, or random objects
   - A screenshot of an app, social media, or travel booking confirmation (vouchers belong to booking verification, not ID verification)
   THEN IT IS STRICTLY INVALID. Set:
   "valid": false,
   "is_id_document": false,
   "confidence_score": 0,
   "document_type": "invalid",
   "rejection_reason": "The uploaded photo is not a valid Government ID card (Aadhaar or Passport). Please upload a clear photo of your official ID document."

3. If this IS a valid Aadhaar Card or Passport:
   Set:
   "valid": true,
   "is_id_document": true,
   "confidence_score": 90,
   "name": "Full legal name as printed on the card",
   "document_type": "Aadhaar" or "Passport",
   "document_number": "12-digit Aadhaar number (e.g. 1234 5678 9012) or Passport number (e.g. A1234567)",
   "dob": "DD/MM/YYYY or YYYY",
   "permanent_address": "Residential address if visible (e.g. from back of Aadhaar)",
   "gender": "Male" | "Female" | "Transgender" | null,
   "above18": true unless DOB indicates under 18

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "valid": boolean,
  "is_id_document": boolean,
  "confidence_score": number,
  "document_type": string,
  "rejection_reason": string or null,
  "name": string or null,
  "document_number": string or null,
  "dob": string or null,
  "permanent_address": string or null,
  "gender": string or null,
  "above18": boolean
}`;

        const parts: any[] = [{ text: prompt }];
        for (const img of cleanImages) {
          parts.push({
            inlineData: {
              data: img,
              mimeType: imageMimeType,
            },
          });
        }

        const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
        for (const modelName of geminiModels) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [{ role: 'user', parts }],
            });

            const text = response.text || '';
            const parsed = extractJsonFromText(text);
            if (parsed && typeof parsed === 'object') {
              // STRICT GATE: Reject non-ID photos immediately
              if (
                parsed.valid === false ||
                parsed.is_id_document === false ||
                (parsed.confidence_score !== undefined && parsed.confidence_score < 30) ||
                parsed.document_type === 'invalid'
              ) {
                return NextResponse.json(
                  {
                    success: false,
                    is_invalid_document: true,
                    error:
                      parsed.rejection_reason ||
                      'The uploaded photo does not appear to be a recognized Government ID card (Aadhaar or Passport). Please upload a clear photo of your official ID document.',
                  },
                  { status: 400 }
                );
              }

              extractedData = { ...parsed };
              visionSucceeded = true;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[Verify ID] Gemini ${modelName} error:`, modelErr?.message);
          }
        }
      } catch (geminiErr: any) {
        console.warn('[Verify ID] Gemini OCR processing warning:', geminiErr?.message);
      }
    }

    // C. Local Tesseract OCR & Regex Fallback (Offline / Zero-Key guarantee)
    if (!visionSucceeded) {
      try {
        const { extractDocumentWithLocalOcr } = await import('@/lib/ai/ocr-fallback');
        const ocrResult = await extractDocumentWithLocalOcr(cleanImages);
        if (ocrResult.success && ocrResult.extracted) {
          extractedData = {
            name: ocrResult.extracted.name,
            document_number: ocrResult.extracted.document_number,
            document_type: ocrResult.extracted.document_type,
            dob: ocrResult.extracted.dob,
            permanent_address: ocrResult.extracted.permanent_address,
            above18: ocrResult.extracted.above18,
            valid: ocrResult.extracted.valid,
          };
          visionSucceeded = true;
        }
      } catch (ocrErr: any) {
        console.warn('[Verify ID] Local OCR fallback warning:', ocrErr?.message);
      }
    }

    // Normalize extracted fields across all possible AI / OCR key naming conventions
    const normalizedName = (
      extractedData.name ||
      (extractedData as any).full_name ||
      (extractedData as any).fullName ||
      ''
    ).trim();

    const normalizedDocNumber = (
      extractedData.document_number ||
      (extractedData as any).id_number ||
      (extractedData as any).aadhaar_number ||
      (extractedData as any).passport_number ||
      (extractedData as any).documentNumber ||
      ''
    ).trim();

    const normalizedDocType = (
      extractedData.document_type ||
      (extractedData as any).id_document_type ||
      (extractedData as any).documentType ||
      'Aadhaar'
    ).trim();

    const normalizedDob = (
      extractedData.dob ||
      (extractedData as any).date_of_birth ||
      (extractedData as any).dateOfBirth ||
      (extractedData as any).birth_date ||
      ''
    ).trim();

    const normalizedAddress = (
      extractedData.permanent_address ||
      (extractedData as any).address ||
      (extractedData as any).residential_address ||
      ''
    ).trim();

    let formattedScanDocNumber = normalizedDocNumber;
    if (normalizedDocType.toLowerCase().includes('aadhaar') && normalizedDocNumber) {
      formattedScanDocNumber = formatAadhaarNumber(normalizedDocNumber);
    }

    // If client requested scan-only (interactive preview in upload modal)
    if (scanOnly) {
      return NextResponse.json({
        success: true,
        visionSucceeded,
        extracted: {
          full_name: normalizedName,
          name: normalizedName,
          document_number: formattedScanDocNumber,
          document_type: normalizedDocType,
          dob: normalizedDob,
          permanent_address: normalizedAddress,
          above18: extractedData.above18 ?? true,
        }
      });
    }

    // 3. Resolve Final Name & Document Number (Prioritize client confirmation or AI extraction)
    const finalDocType = (clientDocType || normalizedDocType || 'Aadhaar').toLowerCase().includes('passport')
      ? 'Passport'
      : 'Aadhaar';

    let finalName = (clientName || normalizedName || '').trim();
    if (!finalName || finalName === 'Nothingness Guest' || finalName === 'Guest' || finalName === 'Full Legal Name') {
      finalName = user?.user_metadata?.full_name || 'Nothingness Guest';
    }

    let finalDocNumber = (clientDocNumber || normalizedDocNumber || '').trim().toUpperCase();

    // Strict Government Document Number Validation
    if (finalDocType === 'Aadhaar') {
      const aadhaarCheck = validateAadhaarNumber(finalDocNumber);
      if (!aadhaarCheck.valid) {
        return NextResponse.json(
          {
            verified: false,
            error: aadhaarCheck.reason || 'Invalid 12-digit Aadhaar number.',
          },
          { status: 400 }
        );
      }
      const digitsOnly = finalDocNumber.replace(/[^0-9]/g, '');
      finalDocNumber = `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 8)} ${digitsOnly.slice(8, 12)}`;
    } else {
      const passportCheck = validatePassportNumber(finalDocNumber);
      if (!passportCheck.valid) {
        return NextResponse.json(
          {
            verified: false,
            error: passportCheck.reason || 'Invalid Passport number.',
          },
          { status: 400 }
        );
      }
    }

    // Statutory Age Gate: Guest must be at least 18 years of age
    const effectiveDob = clientDob || normalizedDob || extractedData.dob;
    const computedAge = calculateAge(effectiveDob);
    if (computedAge !== null && computedAge < 18) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Statutory compliance requires all staying and vetted guests to be at least 18 years of age.',
        },
        { status: 400 }
      );
    }
    if (extractedData.above18 === false) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Statutory compliance requires all staying and vetted guests to be at least 18 years of age.',
        },
        { status: 400 }
      );
    }

    // 4. Upload ID Documents & Extracted Face to Supabase Storage ('guest-ids' bucket)
    const docId = crypto.randomUUID();
    let idFrontUrl: string | null = null;
    let idBackUrl: string | null = null;
    let photoUrl: string | null = null;

    if (cleanImages[0]) {
      idFrontUrl = await uploadBase64ToStorage(
        adminSupabase,
        cleanImages[0],
        `id-documents/${docId}-front.jpg`,
        imageMimeType
      );
    }

    if (cleanImages[1]) {
      idBackUrl = await uploadBase64ToStorage(
        adminSupabase,
        cleanImages[1],
        `id-documents/${docId}-back.jpg`,
        imageMimeType
      );
    }

    if (photoBase64) {
      photoUrl = await uploadBase64ToStorage(
        adminSupabase,
        photoBase64,
        `id-documents/${docId}-photo.jpg`,
        'image/jpeg'
      );
    }

    // 5. Statutory Dynamic Verification Fee Check
    const { fee_id_verification } = await getPlatformActionFees();

    if (fee_id_verification > 0) {
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

        await adminSupabase.from('action_fee_orders').insert({
          user_id: sessionUserId || null,
          action_type: 'id_verification',
          amount: fee_id_verification,
          payment_order_id: orderId,
          payment_status: 'pending',
          metadata: {
            guestName: finalName,
            phone: effectivePhone,
            docNumber: finalDocNumber,
            docType: finalDocType,
            dob: clientDob || extractedData.dob,
            permanentAddress: clientAddress || extractedData.permanent_address,
            idFrontUrl,
            idBackUrl,
            photoUrl,
            bookingId,
            guestId,
            token,
          },
        });

        const { paymentUrl, params } = await createPayUPaymentRequestAsync({
          txnid: orderId,
          amount: fee_id_verification,
          productinfo: 'Police Compliance Statutory ID Verification Fee',
          firstname: finalName,
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
          name: finalName,
        });
      }
    }

    // 6. Upsert into guest_profiles with full fidelity (Name, 12-digit Doc, Front/Back Photos, Avatar)
    const now = new Date();
    const expiresAt = addDays(now, 180).toISOString();
    const isForeign = finalDocType === 'Passport' && Boolean(extractedData.is_foreign_national);
    const policeStatus = isForeign ? 'form_c_required' : 'verified_compliant';

    const profilePayload: any = {
      full_name: finalName,
      document_number: finalDocNumber,
      id_document_type: finalDocType,
      phone: effectivePhone || null,
      phone_number: effectivePhone || null,
      user_id: sessionUserId || null,
      dob: clientDob || extractedData.dob || null,
      permanent_address: clientAddress || extractedData.permanent_address || 'Address recorded on official ID',
      is_foreign_national: isForeign,
      nationality: extractedData.nationality || (isForeign ? 'Foreign' : 'Indian'),
      police_register_status: policeStatus,
      verification_timestamp: now.toISOString(),
      verification_expires_at: expiresAt,
      is_verified: true,
      is_prestored: false,
      id_front_url: idFrontUrl,
      id_back_url: idBackUrl,
      id_document_url: idFrontUrl,
      photo_url: photoUrl,
    };

    let profileId: string | null = null;

    const { data: upsertedProf, error: profError } = await adminSupabase
      .from('guest_profiles')
      .upsert(profilePayload, { onConflict: 'document_number' })
      .select()
      .single();

    if (!profError && upsertedProf) {
      profileId = upsertedProf.id;
    } else if (effectivePhone) {
      const { data: byPhoneProf, error: phoneErr } = await adminSupabase
        .from('guest_profiles')
        .upsert(profilePayload, { onConflict: 'phone' })
        .select()
        .single();
      if (!phoneErr && byPhoneProf) {
        profileId = byPhoneProf.id;
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

    // 7. Update booking_guests if attached to booking
    if (token) {
      await adminSupabase
        .from('booking_guests')
        .update({
          verification_status: 'verified',
          name: finalName,
          guest_profile_id: profileId,
        })
        .or(`verification_token.eq.${token},id.eq.${token}`);
    } else if (bookingId && guestId) {
      await adminSupabase
        .from('booking_guests')
        .update({
          verification_status: 'verified',
          name: finalName,
          guest_profile_id: profileId,
        })
        .eq('id', guestId)
        .eq('booking_id', bookingId);
    }

    // Auto-dispatch Stage 2 (Location & Caretaker) if all guests on booking are verified
    let targetBookingId: string | null = bookingId || null;
    if (!targetBookingId && token) {
      const { data: bgRecord } = await adminSupabase
        .from('booking_guests')
        .select('booking_id')
        .or(`verification_token.eq.${token},id.eq.${token}`)
        .maybeSingle();
      if (bgRecord?.booking_id) targetBookingId = bgRecord.booking_id;
    }

    if (targetBookingId) {
      try {
        const { checkAndDispatchStage2IfAllGuestsVerified } = await import('@/lib/chat/guest-journey');
        await checkAndDispatchStage2IfAllGuestsVerified(targetBookingId);
      } catch (stage2Err) {
        console.warn('[Verify ID] Stage 2 auto-dispatch error:', stage2Err);
      }
    }

    // 8. If logged in, activate kinkster profile
    if (sessionUserId) {
      try {
        await adminSupabase
          .from('kinkster_profiles')
          .update({
            is_id_verified: true,
            id_verified_at: now.toISOString(),
            is_active: true,
            avatar_url: photoUrl || undefined,
          })
          .eq('user_id', sessionUserId);
      } catch (_) {}
    }

    // 9. Dispatch notification
    try {
      if (sessionEmail) {
        sendVerificationApprovedNotification({
          email: sessionEmail,
          phone: effectivePhone || undefined,
          guestName: finalName,
        }).catch(console.error);
      }
    } catch (_) {}

    return NextResponse.json({
      verified: true,
      name: finalName,
      document_number: finalDocNumber,
      document_type: finalDocType,
      photo_url: photoUrl,
      id_front_url: idFrontUrl,
      id_back_url: idBackUrl,
      expires_at: expiresAt,
      message: 'Identity document successfully verified and securely stored for 180 days.',
    });
  } catch (error: any) {
    console.error('[Verify ID] Processing error:', error);
    recordScoutError(error, {
      endpoint: '/api/verify-id',
    });
    return NextResponse.json(
      {
        verified: false,
        error: error.message || 'Error processing identity verification',
      },
      { status: 500 }
    );
  }
}
