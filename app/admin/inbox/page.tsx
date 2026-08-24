import { createClient } from "@/lib/supabase/server";
import { MessageSquare, Send, Mail, Phone, Globe, Bot, Plus, Zap, ToggleLeft, ToggleRight, Settings, Camera, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import ComingSoonButton from "@/components/ComingSoonButton";

export const dynamic = 'force-dynamic';

export default async function AdminInbox({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || 'messages';
  const supabase = await createClient();
  
  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      guest_profiles(full_name, phone_number)
    `)
    .order('created_at', { ascending: false });

  // Fetch chatflows
  const { data: chatflows } = await supabase
    .from('chatflows')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Inbox & Automations</h1>
          <p className="text-white/50 text-sm tracking-wide">Manage conversations, AI flows, and omnichannel connections.</p>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-xl self-start md:self-auto">
          <Link 
            href="/admin/inbox?tab=messages" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'messages' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Messages
          </Link>
          <Link 
            href="/admin/inbox?tab=chatflows" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'chatflows' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Chatflows
          </Link>
          <Link 
            href="/admin/inbox?tab=settings" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
        {/* ============================================================== */}
        {/* MESSAGES TAB */}
        {/* ============================================================== */}
        {currentTab === 'messages' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
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
                      {msg.channel === 'instagram' && <Camera className="w-3 h-3 text-pink-400" />}
                      {msg.channel === 'facebook' && <MessageCircle className="w-3 h-3 text-blue-500" />}
                      <span className="text-[9px] uppercase tracking-wider text-white/30">{msg.channel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Window */}
            <div className="flex-1 flex flex-col h-full bg-black/20">
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
        )}

        {/* ============================================================== */}
        {/* CHATFLOWS TAB */}
        {/* ============================================================== */}
        {currentTab === 'chatflows' && (
          <div className="p-6 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl text-white font-serif">Automated Flows</h2>
              <Link 
                href="/admin/inbox/flows/new" 
                className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create Flow
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatflows?.map((flow) => (
                <div key={flow.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                      <Bot className="w-5 h-5" />
                    </div>
                    <Link href={`/admin/inbox/flows/${flow.id}`} className="text-white/30 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <h3 className="text-lg text-white font-medium mb-1">{flow.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-6">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    Trigger: {flow.trigger_event}
                  </div>
                  
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-6 flex-1">
                    <p className="text-xs text-white/60 line-clamp-3">"{flow.response_template}"</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-wider">
                      <MessageSquare className="w-3 h-3" />
                      {flow.channel}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${flow.is_active ? 'text-green-400' : 'text-white/30'}`}>
                        {flow.is_active ? 'Active' : 'Paused'}
                      </span>
                      {flow.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-400 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/30 cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/admin/inbox/flows/new" className="bg-white/[0.01] border border-white/5 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-white/[0.03] transition-colors group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-accent-gold group-hover:bg-accent-gold/10 transition-colors mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-white font-medium text-sm">Create New Chatflow</p>
                <p className="text-white/40 text-xs mt-1 text-center max-w-[200px]">Automate responses for bookings, check-ins, or common questions.</p>
              </Link>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SETTINGS TAB */}
        {/* ============================================================== */}
        {currentTab === 'settings' && (
          <div className="p-6 md:p-8 h-full overflow-y-auto space-y-8">
            <div>
              <h2 className="text-xl text-white font-serif mb-2">Omnichannel Connections</h2>
              <p className="text-sm text-white/50">Connect your social and messaging accounts to route all customer inquiries into this inbox.</p>
            </div>

            <div className="space-y-4 max-w-3xl">
              {/* WhatsApp Connection */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">WhatsApp Business</h3>
                    <p className="text-xs text-white/50 mt-1">Connect your official WhatsApp API number.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors">
                  Connect
                </button>
              </div>

              {/* Instagram Connection */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Instagram Direct</h3>
                    <p className="text-xs text-white/50 mt-1">Reply to DMs and story mentions directly.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors">
                  Connect
                </button>
              </div>

              {/* Facebook Connection */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Facebook Messenger</h3>
                    <p className="text-xs text-white/50 mt-1">Handle messages from your Facebook page.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors">
                  Connect
                </button>
              </div>

              {/* Email Connection */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-500/10 rounded-xl flex items-center justify-center text-zinc-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Email Inbound</h3>
                    <p className="text-xs text-white/50 mt-1">Receive and reply to support emails.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
