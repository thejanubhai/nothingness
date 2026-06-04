import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/chat/flows";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Twilio WhatsApp Webhook Payload typically comes as form data
    const formData = await request.formData();
    const fromPhone = formData.get('From')?.toString().replace('whatsapp:', '');
    const body = formData.get('Body')?.toString();
    const profileName = formData.get('ProfileName')?.toString() || 'WhatsApp User';

    if (!fromPhone || !body) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Look up if the guest exists by phone number
    const { data: profiles } = await supabase
      .from('guest_profiles')
      // Note: In a real app, you'd match by phone. Assuming document_number or a phone column exists.
      .select('id, full_name')
      .limit(1);
      
    // 2. Find an active conversation for this guest, or create one
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
        // Create new conversation
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
      // Create an anonymous conversation if guest is unknown
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

    // 3. Insert the incoming message
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
        
      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Process message through AI Orchestrator / Chatflows
      const systemReply = await processIncomingMessage(
        conversationId,
        profiles && profiles.length > 0 ? profiles[0].id : null,
        body,
        'whatsapp'
      );

      // In a real app, dispatch systemReply via Twilio API here
      console.log(`[Twilio Webhook] System reply to ${fromPhone}: ${systemReply}`);
    }

    // Twilio expects a valid TwiML response or a 200 OK
    return new NextResponse('<Response></Response>', { 
      status: 200, 
      headers: { 'Content-Type': 'text/xml' } 
    });
  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
