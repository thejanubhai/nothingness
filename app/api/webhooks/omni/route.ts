import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateReply } from '@/app/actions/ai';
import { sendWhatsAppMessage, sendInstagramMessage, verifyMetaWebhookSignature } from '@/lib/omnichannel/meta';
import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';

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
      process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ||
      'nothingnesslallupanchucompanynahinaibe';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Omni Webhook] Verification successful for Meta challenge');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.warn('[Omni Webhook] Verification failed. Received token:', token);
    return new Response('Forbidden', { status: 403 });
  } catch (err: any) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Webhook Cryptographic Security (Meta HMAC-SHA256 Verification: crypto.createHmac('sha256', secret))
    const signatureHeader = req.headers.get('x-hub-signature-256');
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
        console.warn('[Omni Webhook] Invalid Meta HMAC signature. Rejecting spoofed request.');
        return new NextResponse('Unauthorized: Invalid webhook signature', { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse('Bad Request: Invalid JSON', { status: 400 });
    }

    // Acknowledge receipt instantly to Meta
    const response = NextResponse.json({ status: 'ok' }, { status: 200 });

    // Process the message in the background
    after(async () => {
      try {
        const supabase = createAdminClient();

        // Extracting data from Meta payload structure
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0]?.value;
        const messages = changes?.messages;

        // Check if Instagram messaging format
        const igMessaging = entry?.messaging?.[0];
        const isInstagram = payload.object === 'instagram' || Boolean(igMessaging);

        let customerId = '';
        let content = '';
        let mediaId: string | undefined;
        let channel: 'whatsapp' | 'instagram' = 'whatsapp';

        if (isInstagram) {
          channel = 'instagram';
          const igMsg = igMessaging || entry?.changes?.[0]?.value?.messages?.[0];
          // Guard against echo messages (prevent infinite reply loop) and delivery/read receipts
          if (!igMsg || igMsg.message?.is_echo || igMsg.read || igMsg.delivery) {
            return;
          }
          if (!igMsg.message) {
            return;
          }
          customerId = igMsg?.sender?.id || '';
          content = igMsg?.message?.text || '';
          if (igMsg?.message?.attachments?.[0]?.type === 'image') {
            mediaId = igMsg?.message?.attachments?.[0]?.payload?.url;
            if (!content) content = 'id_document';
          }
        } else if (messages && messages.length > 0) {
          channel = 'whatsapp';
          const message = messages[0];
          customerId = message.from ? String(message.from).replace('whatsapp:', '') : '';
          
          if (message.type === 'text') {
            content = message.text?.body || '';
          } else if (message.type === 'image') {
            content = message.image?.caption || 'id_document';
            mediaId = message.image?.id;
          }
        }

        if (!customerId) return;

        // 1. Get or create conversation first to maintain live 2-way thread
        let conversationId: string;
        
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, human_override, guest_profile_id, booking_id')
          .eq('customer_id', customerId)
          .eq('channel', channel)
          .eq('status', 'open')
          .limit(1)
          .maybeSingle();

        let humanOverride = false;

        if (existingConv) {
          conversationId = existingConv.id;
          humanOverride = existingConv.human_override;
        } else {
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              customer_id: customerId,
              channel: channel,
              status: 'open',
              human_override: false,
              subject: `${channel.toUpperCase()} chat with ${customerId}`,
            })
            .select()
            .single();

          if (createError) throw createError;
          conversationId = newConv.id;
          humanOverride = false;
        }

        // 2. Persist the incoming guest message
        await supabase.from('conversation_messages').insert({
          conversation_id: conversationId,
          sender_type: 'guest',
          channel: channel,
          content: content || (mediaId ? '[ID Photo / Document]' : 'Hello'),
          status: 'delivered',
        });

        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        // 3. Check if incoming media is an ID photo
        if (mediaId && (content.toLowerCase().includes('id') || content.toLowerCase().includes('aadhaar') || content.toLowerCase().includes('passport') || content.length < 5 || content === 'id_document')) {
          const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
          if (geminiApiKey) {
            try {
              const ai = new GoogleGenAI({ apiKey: geminiApiKey });
              let inlineImagePart: any = null;

              // If media is a direct HTTP/HTTPS URL (standard for Instagram attachments)
              if (mediaId.startsWith('http')) {
                try {
                  const mediaRes = await fetch(mediaId, {
                    headers: { 'User-Agent': 'Nothingness-Omnichannel/1.0' },
                  });
                  if (mediaRes.ok) {
                    const arrayBuffer = await mediaRes.arrayBuffer();
                    const contentType = mediaRes.headers.get('content-type') || 'image/jpeg';
                    inlineImagePart = {
                      inlineData: {
                        mimeType: contentType.includes('png') ? 'image/png' : 'image/jpeg',
                        data: Buffer.from(arrayBuffer).toString('base64'),
                      }
                    };
                  }
                } catch (dlErr) {
                  console.error('[Omni Webhook] Failed to download Instagram media attachment:', dlErr);
                }
              }
              // If media is WhatsApp media ID requiring Graph API resolution
              else if (process.env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN) {
                const waToken = process.env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
                const metaMediaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
                  headers: { Authorization: `Bearer ${waToken}` }
                });
                const metaMediaJson = await metaMediaRes.json();
                if (metaMediaJson.url) {
                  const imgDownloadRes = await fetch(metaMediaJson.url, {
                    headers: { Authorization: `Bearer ${waToken}` }
                  });
                  const arrayBuffer = await imgDownloadRes.arrayBuffer();
                  inlineImagePart = {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: Buffer.from(arrayBuffer).toString('base64'),
                    }
                  };
                }
              }

              if (inlineImagePart) {
                const promptParts: any[] = [
                  {
                    text: `Analyze this image submitted via ${channel} for Hotel & BnB Police Compliance regulations.
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
                  },
                  inlineImagePart,
                ];

                const aiRes = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: [{ role: 'user', parts: promptParts }]
                });

                const text = aiRes.text || '{}';
                const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

                if (parsed.is_id_document && parsed.valid && parsed.above18) {
                  const now = new Date();
                  const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

                  // Resolve active booking by phone (if in WhatsApp customerId or in message text) or by guest name
                  const phoneMatch = content.match(/[6-9]\d{9}/)?.[0] || (channel === 'whatsapp' ? customerId.slice(-10) : null);
                  const profilePhone = channel === 'whatsapp' ? customerId : (phoneMatch || null);

                  const { data: profile } = await supabase.from('guest_profiles').upsert({
                    document_number: parsed.document_number,
                    full_name: parsed.name,
                    id_document_type: parsed.document_type,
                    phone: profilePhone,
                    phone_number: profilePhone,
                    permanent_address: parsed.permanent_address || 'Address recorded on ID',
                    police_register_status: 'verified_compliant',
                    verification_timestamp: now.toISOString(),
                    verification_expires_at: expiresAt,
                    is_verified: true,
                  }, { onConflict: 'document_number' }).select('id').maybeSingle();

                  let activeBooking: any = null;

                  if (phoneMatch) {
                    const { data: bByPhone } = await supabase
                      .from('bookings')
                      .select('id, guest_name')
                      .ilike('guest_phone', `%${phoneMatch}%`)
                      .neq('status', 'cancelled')
                      .order('check_in', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    if (bByPhone) activeBooking = bByPhone;
                  }

                  if (!activeBooking && parsed.name) {
                    const firstName = parsed.name.trim().split(' ')[0];
                    if (firstName && firstName.length >= 3) {
                      const { data: bByName } = await supabase
                        .from('bookings')
                        .select('id, guest_name')
                        .ilike('guest_name', `%${firstName}%`)
                        .neq('status', 'cancelled')
                        .order('check_in', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                      if (bByName) activeBooking = bByName;
                    }
                  }

                  let stage2Triggered = false;
                  let totalGuestsCount = 1;
                  let verifiedGuestsCount = 1;

                  if (activeBooking) {
                    const { data: bGuests } = await supabase
                      .from('booking_guests')
                      .select('id, verification_status')
                      .eq('booking_id', activeBooking.id);

                    totalGuestsCount = bGuests?.length || 1;
                    const unverified = bGuests?.find(g => g.verification_status !== 'verified');
                    if (unverified) {
                      await supabase
                        .from('booking_guests')
                        .update({
                          verification_status: 'verified',
                          name: parsed.name,
                          guest_profile_id: profile?.id || null,
                        })
                        .eq('id', unverified.id);
                    }

                    const { checkAndDispatchStage2IfAllGuestsVerified } = await import('@/lib/chat/guest-journey');
                    const s2Res = await checkAndDispatchStage2IfAllGuestsVerified(activeBooking.id);
                    if (s2Res.allVerified && s2Res.dispatched) {
                      stage2Triggered = true;
                    }
                    verifiedGuestsCount = s2Res.verifiedGuests;
                    totalGuestsCount = s2Res.totalGuests;
                  }

                  // Update conversation link to verified profile and booking
                  await supabase
                    .from('conversations')
                    .update({
                      guest_profile_id: profile?.id || null,
                      booking_id: activeBooking?.id || null,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversationId);

                  if (!stage2Triggered) {
                    let reply = `✅ Identity Verified! Thank you ${parsed.name}. Your ID (${parsed.document_type}) has been digitally registered for 180 days per Police Compliance regulations.`;
                    if (totalGuestsCount > 1 && verifiedGuestsCount < totalGuestsCount) {
                      reply += `\n\n👥 We have verified ${verifiedGuestsCount} of ${totalGuestsCount} guests. Please send the front & back ID photos of your accompanying guest(s) right here in this chat so that we can immediately release the property location, directions, and caretaker contact details!`;
                    }

                    // Record verification reply in conversation thread
                    await supabase.from('conversation_messages').insert({
                      conversation_id: conversationId,
                      sender_type: 'system',
                      sender_name: 'Nothingness Concierge',
                      channel: channel,
                      content: reply,
                      status: 'delivered',
                    });

                    if (channel === 'whatsapp') {
                      await sendWhatsAppMessage({ to: customerId, text: reply });
                    } else {
                      await sendInstagramMessage({ to: customerId, text: reply });
                    }
                  }
                  return;
                }
              }
            } catch (aiErr) {
              console.error('[Omni Webhook] Gemini ID verification error:', aiErr);
            }
          }
        }

        // 4. If not handled by ID verification flow and human_override is false, trigger Chatflows Engine & AI reply
        if (!humanOverride && content) {
          const { processIncomingMessage } = await import('@/lib/chat/flows');
          const reply = await processIncomingMessage(
            conversationId,
            existingConv?.guest_profile_id || null,
            content,
            channel
          );

          if (reply) {
            if (channel === 'whatsapp') {
              await sendWhatsAppMessage({ to: customerId, text: reply });
            } else {
              await sendInstagramMessage({ to: customerId, text: reply });
            }
          }
        }
      } catch (error) {
        console.error('[Omni Webhook] Error in background processing:', error);
      }
    });

    return response;
  } catch (error) {
    return new NextResponse('Bad Request', { status: 400 });
  }
}
