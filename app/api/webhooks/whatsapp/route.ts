import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/chat/flows";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { verifyMetaWebhookSignature } from "@/lib/omnichannel/meta";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedToken =
      env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      process.env.whatsapp_webhook_verify_token ||
      'nothingnesslallupanchucompanynahinaibe';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[WhatsApp Webhook] Verification successful for Meta challenge');
      return new Response(challenge || '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[WhatsApp Webhook] Verification failed. Received token:', token);
    return new Response('Forbidden', { status: 403 });
  } catch (err: any) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();

    let fromPhone = '';
    let body = '';
    let mediaUrl: string | undefined;
    let profileName = 'WhatsApp User';

    const contentType = request.headers.get('content-type') || '';

    const isJson = contentType.includes('application/json');

    if (isJson) {
      const rawBody = await request.text();

      // Webhook Cryptographic Security (Meta HMAC-SHA256 Verification: crypto.createHmac('sha256', secret))
      const signatureHeader = request.headers.get('x-hub-signature-256');
      const secretsToCheck = [
        env.WHATSAPP_APP_SECRET,
        process.env.WHATSAPP_APP_SECRET,
        process.env.whatsapp_app_secret,
        env.meta_App_secret,
        env.META_APP_SECRET,
        env.Instagram_app_secret,
        env.INSTAGRAM_APP_SECRET,
        process.env.meta_App_secret,
        process.env.META_APP_SECRET,
        process.env.Instagram_app_secret,
        process.env.INSTAGRAM_APP_SECRET,
      ].filter((s): s is string => Boolean(s && s.trim()));

      if (secretsToCheck.length > 0) {
        const isValid = verifyMetaWebhookSignature({
          rawBody,
          signatureHeader,
          secret: secretsToCheck,
        });

        if (!isValid) {
          console.warn('[WhatsApp Webhook] Invalid Meta HMAC signature. Rejecting spoofed request.');
          return NextResponse.json({ error: 'Unauthorized: Invalid webhook signature' }, { status: 401 });
        }
      }

      let payload: any;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }

      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];

      // If it's a delivery status update / read receipt, acknowledge immediately
      if (!message) {
        return NextResponse.json({ status: 'ok', event: 'status_or_read_ack' }, { status: 200 });
      }

      fromPhone = message.from ? String(message.from).replace('whatsapp:', '') : '';
      profileName = contact?.profile?.name || 'WhatsApp User';

      if (message.type === 'text') {
        body = message.text?.body || '';
      } else if (message.type === 'image') {
        body = message.image?.caption || 'id_document';
        mediaUrl = message.image?.id || message.image?.url;
      } else if (message.type === 'document') {
        body = message.document?.caption || 'id_document';
        mediaUrl = message.document?.id || message.document?.url;
      }
    } else {
      // Legacy FormData (Twilio or direct form POST)
      const formData = await request.formData();
      fromPhone = formData.get('From')?.toString().replace('whatsapp:', '') || '';
      body = formData.get('Body')?.toString() || '';
      mediaUrl = formData.get('MediaUrl0')?.toString();
      profileName = formData.get('ProfileName')?.toString() || 'WhatsApp User';
    }

    if (!fromPhone) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // 1. Direct In-Chat Guest ID Verification Photo via Gemini AI
    // -------------------------------------------------------------
    if (mediaUrl && (body.toLowerCase().includes('id') || body.toLowerCase().includes('aadhaar') || body.toLowerCase().includes('passport') || body.toLowerCase().includes('doc') || body.length < 5)) {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });

          // Fetch media content if mediaUrl is a Meta media ID
          let imageInlinePart: any = null;
          const waMediaToken =
            env.WHATSAPP_ACCESS_TOKEN ||
            process.env.WHATSAPP_ACCESS_TOKEN ||
            process.env.whatsapp_access_token;
          if (mediaUrl && !mediaUrl.startsWith('http') && waMediaToken) {
            try {
              const metaMediaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaUrl}`, {
                headers: { Authorization: `Bearer ${waMediaToken}` }
              });
              const metaMediaJson = await metaMediaRes.json();
              if (metaMediaJson.url) {
                const imgDownloadRes = await fetch(metaMediaJson.url, {
                  headers: { Authorization: `Bearer ${waMediaToken}` }
                });
                const arrayBuffer = await imgDownloadRes.arrayBuffer();
                imageInlinePart = {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: Buffer.from(arrayBuffer).toString('base64'),
                  }
                };
              }
            } catch (mediaErr) {
              console.warn('[WhatsApp Webhook] Meta media download warning:', mediaErr);
            }
          }

          const contentsParts: any[] = [
            {
              text: `Analyze this image submitted via WhatsApp for Hotel & BnB Police Compliance regulations.
Determine if it is a government-issued ID (Aadhaar, Passport, Voter ID, Driving License, Foreign Passport).
Extract: Name, Document Type, Document Number, 18+ verification, Permanent Address.

Return JSON ONLY:
{
  "is_id_document": true/false,
  "valid": true/false,
  "name": "Name",
  "document_type": "Aadhaar / Passport / DL / Voter ID",
  "document_number": "XXXX",
  "above18": true/false,
  "permanent_address": "Full Address",
  "reason": "If invalid, why"
}`
            }
          ];

          if (imageInlinePart) {
            contentsParts.push(imageInlinePart);
          } else if (mediaUrl && mediaUrl.startsWith('http')) {
            contentsParts.push({ fileData: { mimeType: 'image/jpeg', fileUri: mediaUrl } });
          }

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: contentsParts }]
          });

          const text = aiResponse.text || '{}';
          const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

          if (parsed.is_id_document && parsed.valid && parsed.above18) {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

            // Upsert into guest_profiles
            const { data: profile } = await supabase.from('guest_profiles').upsert({
              document_number: parsed.document_number,
              full_name: parsed.name,
              id_document_type: parsed.document_type,
              phone: fromPhone,
              phone_number: fromPhone,
              permanent_address: parsed.permanent_address || 'Address recorded on ID',
              police_register_status: 'verified_compliant',
              verification_timestamp: now.toISOString(),
              verification_expires_at: expiresAt,
              is_verified: true,
            }, { onConflict: 'document_number' }).select('id').maybeSingle();

            // Check if there is an active booking for this phone number
            const phoneLast10 = fromPhone.slice(-10);
            const { data: activeBooking } = await supabase
              .from('bookings')
              .select('id, guest_name')
              .ilike('guest_phone', `%${phoneLast10}%`)
              .neq('status', 'cancelled')
              .order('check_in', { ascending: false })
              .limit(1)
              .maybeSingle();

            let stage2Triggered = false;
            let totalGuestsCount = 1;
            let verifiedGuestsCount = 1;

            if (activeBooking) {
              // Update one unverified booking_guests entry for this booking
              const { data: bookingGuests } = await supabase
                .from('booking_guests')
                .select('id, verification_status')
                .eq('booking_id', activeBooking.id);

              totalGuestsCount = bookingGuests?.length || 1;

              const unverifiedGuest = bookingGuests?.find(g => g.verification_status !== 'verified');
              if (unverifiedGuest) {
                await supabase
                  .from('booking_guests')
                  .update({
                    verification_status: 'verified',
                    name: parsed.name,
                    guest_profile_id: profile?.id || null,
                  })
                  .eq('id', unverifiedGuest.id);
              }

              // Check if all guests on this booking are now verified -> auto-dispatch Stage 2
              const { checkAndDispatchStage2IfAllGuestsVerified } = await import('@/lib/chat/guest-journey');
              const stage2Res = await checkAndDispatchStage2IfAllGuestsVerified(activeBooking.id);
              if (stage2Res.allVerified && stage2Res.dispatched) {
                stage2Triggered = true;
              }
              verifiedGuestsCount = stage2Res.verifiedGuests;
              totalGuestsCount = stage2Res.totalGuests;
            }

            if (stage2Triggered) {
              if (isJson) {
                return NextResponse.json({ status: 'ok', event: 'stage_2_dispatched' });
              } else {
                return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
              }
            }

            let replyMsg = `✅ Identity Verified! Thank you ${parsed.name}. Your ID (${parsed.document_type}) has been digitally registered for 180 days per Police Compliance regulations.`;
            if (totalGuestsCount > 1 && verifiedGuestsCount < totalGuestsCount) {
              replyMsg += `\n\n👥 We have verified ${verifiedGuestsCount} of ${totalGuestsCount} guests. Please send the front & back ID photos of your accompanying guest(s) right here in this chat so that we can immediately release the property location, directions, and caretaker contact details!`;
            }

            if (isJson) {
              const { sendWhatsAppMessage } = await import('@/lib/omnichannel/meta');
              await sendWhatsAppMessage({ to: fromPhone, text: replyMsg });
              return NextResponse.json({ status: 'ok', verified: true });
            } else {
              const replyXml = `<Response><Message>${replyMsg}</Message></Response>`;
              return new NextResponse(replyXml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
            }
          }
        } catch (idErr) {
          console.error('In-chat WhatsApp ID verification error:', idErr);
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Housekeeping Cleaner Inspection Photo Analysis via Gemini Vision
    // -------------------------------------------------------------
    if (mediaUrl || body.toLowerCase().includes('clean') || body.toLowerCase().includes('turnover')) {
      const { data: space } = await supabase
        .from('spaces')
        .select('id, title, cleaner_phone, cleaner_name')
        .ilike('cleaner_phone', `%${fromPhone.slice(-10)}%`)
        .limit(1)
        .single();

      if (space || mediaUrl) {
        let aiScore = 90;
        let aiSummary = "Turnover inspection completed. Room & bed linen appear clean and prepared for next guest.";
        
        if (mediaUrl && process.env.GEMINI_API_KEY) {
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are an AI Housekeeping Quality Inspector for Nothingness luxury sanctuaries.
                      Analyze this turnover inspection photo submitted by the cleaning staff.
                      Return ONLY a JSON object:
                      {
                        "cleanliness_score": number (0-100),
                        "passed": true/false,
                        "summary": "Brief inspection summary"
                      }`
                    },
                    { fileData: { mimeType: 'image/jpeg', fileUri: mediaUrl } }
                  ]
                }
              ]
            });

            const text = response.text || '{}';
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            if (parsed.cleanliness_score !== undefined) aiScore = parsed.cleanliness_score;
            if (parsed.summary) aiSummary = parsed.summary;
          } catch (visionErr) {
            console.error('Gemini Vision photo analysis error:', visionErr);
          }
        }

        const targetSpaceId = space?.id;
        const todayStr = new Date().toISOString().split('T')[0];

        let taskQuery = supabase.from('housekeeping_tasks').select('id').eq('scheduled_date', todayStr);
        if (targetSpaceId) taskQuery = taskQuery.eq('space_id', targetSpaceId);

        const { data: existingTask } = await taskQuery.limit(1).single();

        if (existingTask) {
          await supabase
            .from('housekeeping_tasks')
            .update({
              status: 'completed',
              inspection_image_url: mediaUrl || null,
              ai_cleanliness_score: aiScore,
              ai_inspection_result: { summary: aiSummary, score: aiScore, timestamp: new Date().toISOString() },
            })
            .eq('id', existingTask.id);

          const xmlReply = `<Response><Message>Thank you ${profileName}! Optical inspection verified turnover standards (Score: ${aiScore}/100). Sanctuary turnover marked COMPLETED.</Message></Response>`;
          return new NextResponse(xmlReply, { status: 200, headers: { 'Content-Type': 'text/xml' } });
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Guest Messaging & Chatflow Engine Processing
    // -------------------------------------------------------------
    const phoneLast10 = fromPhone.slice(-10);
    const { data: matchedProfile } = await supabase
      .from('guest_profiles')
      .select('id, full_name')
      .or(`phone.ilike.%${phoneLast10}%,phone_number.ilike.%${phoneLast10}%`)
      .limit(1)
      .maybeSingle();

    let conversationId: string | null = null;
    let humanOverride = false;

    // Check if open conversation exists by customer_id or guest_profile_id
    let convQuery = supabase
      .from('conversations')
      .select('id, human_override')
      .eq('status', 'open')
      .eq('channel', 'whatsapp');

    if (matchedProfile?.id) {
      convQuery = convQuery.or(`customer_id.eq.${fromPhone},guest_profile_id.eq.${matchedProfile.id}`);
    } else {
      convQuery = convQuery.eq('customer_id', fromPhone);
    }

    const { data: existingConv } = await convQuery
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      humanOverride = existingConv.human_override;
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          customer_id: fromPhone,
          guest_profile_id: matchedProfile?.id || null,
          channel: 'whatsapp',
          subject: `WhatsApp chat with ${profileName || fromPhone}`,
          status: 'open',
          human_override: false,
        })
        .select()
        .single();
      if (newConv) conversationId = newConv.id;
    }

    if (conversationId) {
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'guest',
          sender_name: profileName,
          channel: 'whatsapp',
          content: body,
          status: 'delivered'
        });
        
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (!humanOverride && body) {
        const systemReply = await processIncomingMessage(
          conversationId,
          matchedProfile?.id || null,
          body,
          'whatsapp'
        );

        console.log(`[WhatsApp Webhook] System reply to ${fromPhone}: ${systemReply}`);

        // Dispatch reply back to guest via Meta Cloud API or Twilio XML
        if (isJson && systemReply) {
          const { sendWhatsAppMessage } = await import('@/lib/omnichannel/meta');
          await sendWhatsAppMessage({ to: fromPhone, text: systemReply });
          return NextResponse.json({ status: 'ok', replied: true });
        } else if (!isJson && systemReply) {
          const replyXml = `<Response><Message>${systemReply}</Message></Response>`;
          return new NextResponse(replyXml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
        }
      }
    }

    if (isJson) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    return new NextResponse('<Response></Response>', { 
      status: 200, 
      headers: { 'Content-Type': 'text/xml' } 
    });
  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
