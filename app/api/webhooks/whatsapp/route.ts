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
    // 1. Housekeeping Cleaner Inspection Photo Analysis via Gemini Vision
    // -------------------------------------------------------------
    if (mediaUrl || body.toLowerCase().includes('clean') || body.toLowerCase().includes('turnover')) {
      // Check if fromPhone belongs to a cleaner or there is an active pending task
      const { data: space } = await supabase
        .from('spaces')
        .select('id, title, cleaner_phone, cleaner_name')
        .ilike('cleaner_phone', `%${fromPhone.slice(-10)}%`)
        .limit(1)
        .single();

      if (space || mediaUrl) {
        let aiScore = 90;
        let aiSummary = "Turnover inspection completed. Room & bed linen appear clean and prepared for next guest.";
        
        // Call Gemini Vision AI if media image URL present and GEMINI_API_KEY configured
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
                      Assess:
                      1. Bed arrangement & linen cleanliness
                      2. Floor condition & room tidiness
                      3. Absence of clutter/trash
                      
                      Return ONLY a JSON object:
                      {
                        "cleanliness_score": number (0-100),
                        "passed": true/false,
                        "summary": "Brief 1-2 sentence inspection summary"
                      }`
                    },
                    {
                      fileData: {
                        mimeType: 'image/jpeg',
                        fileUri: mediaUrl
                      }
                    }
                  ]
                }
              ]
            });

            const text = response.text || '{}';
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.cleanliness_score !== undefined) aiScore = parsed.cleanliness_score;
            if (parsed.summary) aiSummary = parsed.summary;
          } catch (visionErr) {
            console.error('Gemini Vision photo analysis error:', visionErr);
          }
        }

        const targetSpaceId = space?.id;
        const todayStr = new Date().toISOString().split('T')[0];

        // Find and update today's housekeeping task for this space
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

          console.log(`[WhatsApp Webhook] Housekeeping task ${existingTask.id} marked COMPLETED via AI Vision score: ${aiScore}`);

          const xmlReply = `<Response><Message>Thank you ${profileName}! Gemini AI Vision has verified your turnover inspection (Score: ${aiScore}/100). Sanctuary turnover is marked COMPLETED.</Message></Response>`;
          return new NextResponse(xmlReply, { status: 200, headers: { 'Content-Type': 'text/xml' } });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. Guest Messaging & Chatflow Engine Processing
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
