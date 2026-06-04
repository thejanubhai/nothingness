'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Send, MessageSquare, Phone, Mail, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InboxClient({ initialConversations }: { initialConversations: any[] }) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialConversations[0]?.id || null);
  const [replyContent, setReplyContent] = useState('');
  const [replyChannel, setReplyChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);

  const activeConv = conversations.find(c => c.id === activeId);

  const handleSend = async () => {
    if (!replyContent.trim() || !activeConv) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/inbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          content: replyContent,
          channel: replyChannel
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setConversations(prev => prev.map(c => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              conversation_messages: [...(c.conversation_messages || []), newMessage.message],
              updated_at: new Date().toISOString()
            };
          }
          return c;
        }));
        setReplyContent('');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <Phone className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex h-full bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      {/* LEFT PANE: Queue */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-serif text-xl text-white mb-4">Inbox</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search guests..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div 
              key={conv.id} 
              onClick={() => setActiveId(conv.id)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${activeId === conv.id ? 'bg-white/10 border-l-2 border-l-accent-gold' : 'hover:bg-white/5'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-medium text-white truncate pr-2">
                  {conv.guest_profiles?.full_name || 'Unknown Guest'}
                </p>
                <span className="text-[10px] text-white/40 whitespace-nowrap">
                  {format(new Date(conv.updated_at), 'MMM dd')}
                </span>
              </div>
              <p className="text-xs text-accent-gold mb-1 truncate">{conv.subject}</p>
              <p className="text-xs text-white/50 truncate">
                {conv.conversation_messages?.[conv.conversation_messages.length - 1]?.content || 'No messages'}
              </p>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-white/30 text-sm">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANE: Chat Thread */}
      <div className="flex-1 flex flex-col bg-black/40 relative">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center z-10">
              <div>
                <h3 className="font-serif text-lg text-white">{activeConv.subject}</h3>
                <p className="text-xs text-white/50">{activeConv.guest_profiles?.full_name}</p>
              </div>
              <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border ${
                activeConv.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                activeConv.status === 'snoozed' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' :
                'bg-white/5 text-white/40 border-white/10'
              }`}>
                {activeConv.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeConv.conversation_messages?.map((msg: any) => {
                const isAdmin = msg.sender_type === 'admin' || msg.sender_type === 'system';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1">
                          {getChannelIcon(msg.channel)} {msg.channel}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAdmin 
                          ? 'bg-white/10 text-white rounded-tr-none' 
                          : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20 z-10">
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-accent-gold/50 transition-colors">
                <textarea 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type a reply..." 
                  className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none"
                  rows={3}
                />
                <div className="flex justify-between items-center p-2 bg-black/20 border-t border-white/5">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40">Reply via:</span>
                    <select 
                      value={replyChannel}
                      onChange={(e) => setReplyChannel(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="whatsapp" className="bg-black text-white">WhatsApp</option>
                      <option value="email" className="bg-black text-white">Email</option>
                      <option value="sms" className="bg-black text-white">SMS</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleSend}
                    disabled={sending || !replyContent.trim()}
                    className="flex items-center gap-2 bg-accent-gold text-black px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Guest Context */}
      <div className="w-80 border-l border-white/5 bg-black/20 overflow-y-auto">
        {activeConv ? (
          <div className="p-6 space-y-8">
            <div>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl text-white mb-4">
                {activeConv.guest_profiles?.full_name?.charAt(0) || '?'}
              </div>
              <h3 className="font-serif text-xl text-white mb-1">{activeConv.guest_profiles?.full_name || 'Guest'}</h3>
              <p className="text-xs text-white/50 font-mono">ID: {activeConv.guest_profiles?.id?.split('-')[0]}</p>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-6">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Verification Protocol</p>
              {activeConv.guest_profiles?.is_verified ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </div>
                  <span className="text-[10px] text-green-400/50">{activeConv.guest_profiles?.document_number}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" /> Unverified
                  </div>
                  <button className="text-[10px] text-white hover:text-accent-gold transition-colors">Resend Link</button>
                </div>
              )}
            </div>

            {activeConv.bookings && (
              <div className="space-y-3 border-t border-white/5 pt-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Current Booking</p>
                  <Link href={`/admin/bookings`} className="text-[10px] text-accent-gold hover:underline">View All</Link>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
                  <p className="text-sm text-white font-medium">{activeConv.bookings.spaces?.title}</p>
                  <p className="text-xs text-white/50">
                    {format(new Date(activeConv.bookings.check_in), 'MMM dd')} - {format(new Date(activeConv.bookings.check_out), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-sm">
            No context available
          </div>
        )}
      </div>
    </div>
  );
}
