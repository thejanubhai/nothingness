import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, channel } = body;

    if (!conversationId || !content || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get conversation details to find the guest recipient
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('guest_id, guest_profiles(email, phone, first_name, last_name)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const guestProfile = Array.isArray(conversation.guest_profiles) 
      ? conversation.guest_profiles[0] 
      : conversation.guest_profiles;

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

    // 3. Dispatch via Resend (Only if channel is email and email exists)
    if (channel === 'email' && guestProfile?.email) {
      if (env.RESEND_API_KEY) {
        const resend = new Resend(env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'Nothingness <hello@nothingness.asia>',
          to: guestProfile.email,
          subject: 'New message from Nothingness',
          html: `
            <div style="font-family: sans-serif; max-w-md; margin: auto;">
              <p>Hello ${guestProfile.first_name || 'Guest'},</p>
              <p>You have a new message from our team:</p>
              <blockquote style="border-left: 4px solid #d4af37; padding-left: 16px; margin-top: 16px; font-style: italic;">
                ${content}
              </blockquote>
            </div>
          `
        });

        // 4. Update status to 'delivered'
        await supabase
          .from('conversation_messages')
          .update({ status: 'delivered' })
          .eq('id', message.id);
      } else {
        console.warn('RESEND_API_KEY is missing. Message saved to DB but email was not sent.');
      }
    } else {
      console.warn('Channel is not email, or guest has no email. Message saved to DB only.');
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error in send message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
