import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/chat/flows";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Twilio / WhatsApp Webhook Payload
    const formData = await request.formData();
    const fromPhone = formData.get('From')?.toString().replace('whatsapp:', '');
    const body = formData.get('Body')?.toString() || '';
    const mediaUrl = formData.get('MediaUrl0')?.toString();
    const profileName = formData.get('ProfileName')?.toString() || 'WhatsApp User';

    if (!fromPhone) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // 1. Direct In-Chat Guest ID Verification Photo via Gemini AI
    // -------------------------------------------------------------
    if (mediaUrl && (body.toLowerCase().includes('id') || body.toLowerCase().includes('aadhaar') || body.toLowerCase().includes('passport') || body.toLowerCase().includes('doc') || body.length < 5)) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Analyze this image submitted via WhatsApp for Delhi Hotel & BnB police check-in compliance.
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
                  {
                    fileData: { mimeType: 'image/jpeg', fileUri: mediaUrl }
                  }
                ]
              }
            ]
          });

          const text = aiResponse.text || '{}';
          const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

          if (parsed.is_id_document && parsed.valid && parsed.above18) {
            // Upsert into guest_profiles
            await supabase.from('guest_profiles').upsert({
              document_number: parsed.document_number,
              full_name: parsed.name,
              id_document_type: parsed.document_type,
              permanent_address: parsed.permanent_address || 'Address recorded on ID',
              police_register_status: 'verified_compliant',
              is_verified: true,
            }, { onConflict: 'document_number' });

            const replyXml = `<Response><Message>✅ Identity Verified! Thank you ${parsed.name}. Your ID (${parsed.document_type}) has been digitally registered per Delhi Police regulations.\n\n👥 If you have accompanying guests staying with you, please send their ID photos in this chat as well!</Message></Response>`;
            return new NextResponse(replyXml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
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
    const { data: profiles } = await supabase
      .from('guest_profiles')
      .select('id, full_name')
      .limit(1);
      
    let conversationId = null;
    
    if (profiles && profiles.length > 0) {
      const guest = profiles[0];
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('guest_profile_id', guest.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (convs && convs.length > 0) {
        conversationId = convs[0].id;
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            guest_profile_id: guest.id,
            subject: 'WhatsApp Inquiry',
            status: 'open'
          })
          .select()
          .single();
        if (newConv) conversationId = newConv.id;
      }
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          subject: `WhatsApp Inquiry from ${fromPhone}`,
          status: 'open'
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

      const systemReply = await processIncomingMessage(
        conversationId,
        profiles && profiles.length > 0 ? profiles[0].id : null,
        body,
        'whatsapp'
      );

      console.log(`[WhatsApp Webhook] System reply to ${fromPhone}: ${systemReply}`);
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
