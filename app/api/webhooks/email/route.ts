import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Inbound Email Parse Payload (e.g., SendGrid Inbound Parse)
    const formData = await request.formData();
    const from = formData.get('from')?.toString(); // e.g. "John Doe <john@example.com>"
    const subject = formData.get('subject')?.toString() || 'No Subject';
    const text = formData.get('text')?.toString() || '';
    
    // Basic email extraction
    const emailMatch = from?.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : from;
    const nameMatch = from?.match(/^([^<]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Email User';

    if (!email || !text) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Create a generic conversation (In a real app, match by email or thread ID in subject)
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        subject: subject,
        status: 'open'
      })
      .select()
      .single();

    if (convError) throw convError;

    // 2. Insert the incoming email message
    if (newConv) {
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: newConv.id,
          sender_type: 'guest',
          sender_name: name,
          channel: 'email',
          content: text.substring(0, 1000), // truncate for safety
          status: 'delivered'
        });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in Email webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
