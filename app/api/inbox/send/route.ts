import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate admin (in a real app, verify they have admin role)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, channel } = body;

    if (!conversationId || !content || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert message into the database
    const { data: message, error: dbError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'admin',
        sender_id: user.id,
        sender_name: 'Nothingness Admin',
        channel: channel,
        content: content,
        status: 'sent'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Update the conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 3. Dispatch to external API (Twilio / SendGrid)
    // Here you would look up the guest's phone number or email from the guest_profiles table
    // and make the actual HTTP request to Twilio API or SendGrid API.
    // Example:
    // if (channel === 'whatsapp') { await sendTwilioWhatsApp(guestPhone, content); }

    // 4. Update status to 'delivered'
    await supabase
      .from('conversation_messages')
      .update({ status: 'delivered' })
      .eq('id', message.id);

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error in send message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
