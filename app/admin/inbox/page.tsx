import { createClient } from "@/lib/supabase/server";
import InboxClient from "./InboxClient";

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const supabase = await createClient();

  // Fetch conversations with the guest profile details
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, subject, status, created_at, updated_at, guest_profile_id, booking_id, assigned_to,
      guest_profiles (id, full_name, document_number, is_verified),
      bookings (id, check_in, check_out, properties(title)),
      conversation_messages (
        id, sender_type, sender_name, channel, content, status, created_at
      )
    `)
    .order('updated_at', { ascending: false });

  // For each conversation, sort messages ascending
  if (conversations) {
    conversations.forEach((conv: any) => {
      if (conv.conversation_messages) {
        conv.conversation_messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
  }

  return (
    <div className="h-[calc(100vh-6rem)] -mt-4">
      <InboxClient initialConversations={conversations || []} />
    </div>
  );
}
