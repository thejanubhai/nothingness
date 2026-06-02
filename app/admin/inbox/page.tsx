import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Send, Mail, Phone, Globe, Clock } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function AdminInbox() {
  const supabase = await createClient();
  
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      guest_profiles(full_name, email, phone)
    `)
    .order('created_at', { ascending: false });

  // In a real implementation, we would group these by guest_profile_id to create conversation threads.
  // For the V1 prototype, we just display a feed.
  
  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-100px)]">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Omnichannel Inbox</h1>
        <p className="text-white/50 text-sm tracking-wide">Manage conversations across WhatsApp, Email, and SMS.</p>
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Thread List */}
        <div className="w-full md:w-1/3 border-r border-white/5 flex flex-col h-full bg-white/[0.01]">
          <div className="p-4 border-b border-white/5">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {messages?.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">
                No active conversations.
              </div>
            ) : (
              <div className="p-4 text-center text-white/30 text-sm">
                Select a conversation to start messaging.
              </div>
            )}
            
            {/* Example static threads for UI visualization */}
            {messages?.map((msg) => (
              <div key={msg.id} className="p-4 border-b border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-medium text-sm">{msg.guest_profiles?.full_name || 'Unknown Guest'}</h3>
                  <span className="text-[10px] text-white/40">{format(new Date(msg.created_at), 'HH:mm')}</span>
                </div>
                <p className="text-xs text-white/50 truncate">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  {msg.channel === 'whatsapp' && <MessageSquare className="w-3 h-3 text-green-400" />}
                  {msg.channel === 'email' && <Mail className="w-3 h-3 text-blue-400" />}
                  {msg.channel === 'sms' && <Phone className="w-3 h-3 text-purple-400" />}
                  <span className="text-[9px] uppercase tracking-wider text-white/30">{msg.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Window */}
        <div className="flex-1 flex flex-col h-full">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-white font-medium">Select a Conversation</h2>
            <p className="text-xs text-white/50 mt-1">Unified messaging feed</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
            <div className="text-center text-white/20 text-sm flex flex-col items-center justify-center h-full gap-4">
              <Globe className="w-12 h-12 opacity-50" />
              <p>Your workspace is ready.</p>
            </div>
          </div>
          
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            <form className="flex items-center gap-2 relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 disabled:opacity-50"
              />
              <button disabled className="absolute right-2 p-2 bg-accent-gold text-black rounded-lg disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-white/30 text-center mt-2">Replies are sent automatically via the preferred channel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
