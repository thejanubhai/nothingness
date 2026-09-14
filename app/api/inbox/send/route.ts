import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { conversationId, content, channel } = body;

    if (!conversationId || !content || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const effectiveChannel = String(channel).toLowerCase();

    // Get conversation details to find the guest recipient
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, guest_id, customer_id, channel, subject, guest_profiles(email, phone, first_name, last_name)')
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
        sender_name: 'Nothingness Host',
        channel: effectiveChannel,
        content: content,
        status: 'sent'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Mark preceding guest messages as read in this conversation
    await supabase
      .from('conversation_messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'guest')
      .neq('status', 'read');

    // 3. Update the conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 4. Dispatch via WhatsApp Cloud API (Meta Graph API)
    if (effectiveChannel === 'whatsapp') {
      const recipientPhone = guestProfile?.phone || conversation.customer_id;
      if (recipientPhone) {
        try {
          const { sendWhatsAppMessage } = await import('@/lib/omnichannel/meta');
          const waResult = await sendWhatsAppMessage({ to: recipientPhone, text: content });
          await supabase
            .from('conversation_messages')
            .update({ status: waResult.success ? 'delivered' : 'failed' })
            .eq('id', message.id);
        } catch (waErr) {
          console.error('[Inbox Send] WhatsApp dispatch error:', waErr);
          await supabase
            .from('conversation_messages')
            .update({ status: 'failed' })
            .eq('id', message.id);
        }
      }
    }
    // 4. Dispatch via Instagram Messaging (Meta Graph API)
    else if (channel === 'instagram') {
      const igRecipient = conversation.customer_id || guestProfile?.phone;
      if (igRecipient) {
        try {
          const { sendInstagramMessage } = await import('@/lib/omnichannel/meta');
          const igResult = await sendInstagramMessage({ to: igRecipient, text: content });
          await supabase
            .from('conversation_messages')
            .update({ status: igResult.success ? 'delivered' : 'failed' })
            .eq('id', message.id);
        } catch (igErr) {
          console.error('[Inbox Send] Instagram dispatch error:', igErr);
          await supabase
            .from('conversation_messages')
            .update({ status: 'failed' })
            .eq('id', message.id);
        }
      }
    }
    // 5. Dispatch via Resend (Email)
    else if (channel === 'email' && guestProfile?.email) {
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

        await supabase
          .from('conversation_messages')
          .update({ status: 'delivered' })
          .eq('id', message.id);
      }
    }

    // 6. AI Continuous Learning: Train AI knowledge base with host's authentic reply
    try {
      const { data: latestGuestMsg } = await supabase
        .from('conversation_messages')
        .select('content')
        .eq('conversation_id', conversationId)
        .in('sender_type', ['guest', 'user'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const guestQuery = latestGuestMsg?.content || conversation.subject || 'Guest inquiry';
      const { trainAI } = await import('@/app/actions/ai');
      await trainAI(guestQuery, content);
    } catch (trainErr) {
      console.warn('[Inbox Send] AI continuous training warning:', trainErr);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error in send message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
