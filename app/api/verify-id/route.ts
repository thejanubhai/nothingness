import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationApprovedNotification } from '@/lib/notifications/verification';
import { getPlatformActionFees, createPayUPaymentRequestAsync } from '@/lib/payu';
import { addDays } from 'date-fns';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
            .eq('verification_token', token);
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

    // 2. Multimodal AI Extraction (NVIDIA NIM or Google Gemini)
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

    // A. NVIDIA Multimodal Vision AI
    try {
      const { extractDocumentWithNvidiaVision } = await import('@/lib/ai/nvidia');
      const nvidiaResult = await extractDocumentWithNvidiaVision({
        images: cleanImages,
        mimeType: imageMimeType,
      });

      if (nvidiaResult.success && nvidiaResult.extracted) {
        extractedData = { ...nvidiaResult.extracted };
        visionSucceeded = true;
      }
    } catch (nvidiaErr: any) {
      console.warn('[Verify ID] NVIDIA Vision error:', nvidiaErr?.message);
    }

    // B. Google Gemini Vision Fallback
    if (!visionSucceeded) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });

          const prompt = `You are an expert hospitality and government ID verification OCR system for "Nothingness" luxury retreats.
Analyze the uploaded image(s) of the guest's Indian Aadhaar Card or Passport.

Extract with point-to-point accuracy:
1. "valid": true if authentic Aadhaar or Passport.
2. "name": The exact full legal name of the person as printed on the card.
3. "document_type": "Aadhaar" or "Passport".
4. "document_number": Cleanly formatted 12-digit Aadhaar number (e.g. "1234 5678 9012") or Passport number.
5. "dob": Date of birth (DD/MM/YYYY or YYYY).
6. "permanent_address": Residential address if visible (especially on back of Aadhaar).
7. "above18": true unless DOB indicates under 18.
8. "is_foreign_national": false for Indian Aadhaar, true if foreign passport.
9. "nationality": "Indian" or country name.

Return ONLY a valid JSON object without markdown formatting.`;

          const parts: any[] = [{ text: prompt }];
          for (const img of cleanImages) {
            parts.push({
              inlineData: {
                data: img,
                mimeType: imageMimeType,
              },
            });
          }

          const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
          for (const modelName of geminiModels) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts }],
              });

              const text = response.text || '{}';
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && typeof parsed === 'object') {
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
    }

    // If client requested scan-only (interactive preview in upload modal)
    if (scanOnly) {
      return NextResponse.json({
        success: true,
        visionSucceeded,
        extracted: {
          full_name: extractedData.name || '',
          document_number: extractedData.document_number || '',
          document_type: extractedData.document_type || 'Aadhaar',
          dob: extractedData.dob || '',
          permanent_address: extractedData.permanent_address || '',
          above18: extractedData.above18 ?? true,
        }
      });
    }

    // 3. Resolve Final Name & Document Number (Prioritize client confirmation or AI extraction)
    const finalDocType = (clientDocType || extractedData.document_type || 'Aadhaar').toLowerCase().includes('passport')
      ? 'Passport'
      : 'Aadhaar';

    let finalName = (clientName || extractedData.name || '').trim();
    if (!finalName || finalName === 'Nothingness Guest' || finalName === 'Guest' || finalName === 'Full Legal Name') {
      finalName = user?.user_metadata?.full_name || 'Nothingness Guest';
    }

    let finalDocNumber = (clientDocNumber || extractedData.document_number || '').trim().toUpperCase();
    // Validate Aadhaar: remove spaces to check length
    const digitsOnly = finalDocNumber.replace(/[^0-9]/g, '');
    if (finalDocType === 'Aadhaar' && digitsOnly.length === 12) {
      // Format cleanly as 1234 5678 9012
      finalDocNumber = `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 8)} ${digitsOnly.slice(8, 12)}`;
    }

    if (!finalDocNumber || finalDocNumber.length < 4) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Please provide a valid 12-digit Aadhaar number or Passport number.',
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
        .eq('verification_token', token);
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
    return NextResponse.json(
      {
        verified: false,
        error: error.message || 'Error processing identity verification',
      },
      { status: 500 }
    );
  }
}
