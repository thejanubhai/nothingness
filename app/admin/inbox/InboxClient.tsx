'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Camera,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function safeFormatDate(dateVal: any, fmt: string): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch {
    return '';
  }
}

export default function InboxClient({
  initialConversations,
  initialChannel = 'all',
}: {
  initialConversations: any[];
  initialChannel?: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [channelFilter, setChannelFilter] = useState<string>(initialChannel || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (!initialChannel || initialChannel === 'all') {
      return initialConversations[0]?.id || null;
    }
    const matching = initialConversations.find(
      (c) => c.channel?.toLowerCase() === initialChannel.toLowerCase()
    );
    return matching?.id || initialConversations[0]?.id || null;
  });
  const [replyContent, setReplyContent] = useState('');
  const [replyChannel, setReplyChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);

  // Sync with initialChannel prop when it changes
  useEffect(() => {
    if (initialChannel) {
      setChannelFilter(initialChannel.toLowerCase());
    }
  }, [initialChannel]);

  // Support deep-linking via browser URL query params (e.g. ?channel=whatsapp or ?channel=instagram)
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const ch = urlParams.get('channel');
        if (ch) {
          const lower = ch.toLowerCase();
          if (['whatsapp', 'instagram', 'email', 'all'].includes(lower)) {
            setChannelFilter(lower);
          }
        }
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const handleSelectChannel = (channel: string) => {
    const target = channel.toLowerCase();
    if (target === 'instagram') {
      setChannelFilter('instagram');
    } else if (target === 'whatsapp') {
      setChannelFilter('whatsapp');
    } else if (target === 'email') {
      setChannelFilter('email');
    } else {
      setChannelFilter('all');
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (target === 'all') {
        url.searchParams.delete('channel');
      } else {
        url.searchParams.set('channel', target);
      }
      url.searchParams.set('tab', 'messages');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Helper to compute unread guest messages count in a conversation
  const getConvUnreadCount = (conv: any): number => {
    if (!conv.conversation_messages || !Array.isArray(conv.conversation_messages)) return 0;
    return conv.conversation_messages.filter(
      (m: any) => m.sender_type === 'guest' && m.status !== 'read'
    ).length;
  };

  // Mark conversation messages as read locally and persist to server
  const handleSelectConv = (convId: string) => {
    setActiveId(convId);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            conversation_messages: (c.conversation_messages || []).map((m: any) =>
              m.sender_type === 'guest' ? { ...m, status: 'read' } : m
            ),
          };
        }
        return c;
      })
    );
    fetch('/api/inbox/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId }),
    }).catch(() => {});
  };

  // Channel counts and unread badges
  const igCount = conversations.filter((c) => c.channel?.toLowerCase() === 'instagram').length;
  const waCount = conversations.filter((c) => c.channel?.toLowerCase() === 'whatsapp').length;
  const emailCount = conversations.filter((c) => c.channel?.toLowerCase() === 'email').length;

  const totalUnreadCount = conversations.reduce(
    (acc, c) => acc + (getConvUnreadCount(c) > 0 ? 1 : 0),
    0
  );
  const waUnreadCount = conversations
    .filter((c) => c.channel?.toLowerCase() === 'whatsapp')
    .reduce((acc, c) => acc + (getConvUnreadCount(c) > 0 ? 1 : 0), 0);
  const igUnreadCount = conversations
    .filter((c) => c.channel?.toLowerCase() === 'instagram')
    .reduce((acc, c) => acc + (getConvUnreadCount(c) > 0 ? 1 : 0), 0);
  const emailUnreadCount = conversations
    .filter((c) => c.channel?.toLowerCase() === 'email')
    .reduce((acc, c) => acc + (getConvUnreadCount(c) > 0 ? 1 : 0), 0);

  const filteredConversations = conversations.filter((conv) => {
    const matchesChannel =
      channelFilter === 'all' || conv.channel?.toLowerCase() === channelFilter.toLowerCase();
    const guestName = conv.guest_profiles?.full_name || '';
    const subject = conv.subject || '';
    const customerId = conv.customer_id || '';
    const phone = conv.guest_profiles?.phone || conv.guest_profiles?.phone_number || '';
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      guestName.toLowerCase().includes(query) ||
      subject.toLowerCase().includes(query) ||
      customerId.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query);
    return matchesChannel && matchesSearch;
  });

  const activeConv = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (
      filteredConversations.length > 0 &&
      (!activeId || !filteredConversations.some((c) => c.id === activeId))
    ) {
      setActiveId(filteredConversations[0].id);
    }
  }, [channelFilter, searchQuery]);

  useEffect(() => {
    if (activeConv?.channel) {
      setReplyChannel(activeConv.channel.toLowerCase());
    }
  }, [activeId, activeConv?.channel]);

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
          channel: replyChannel,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConv.id) {
              return {
                ...c,
                conversation_messages: [...(c.conversation_messages || []), newMessage.message],
                updated_at: new Date().toISOString(),
              };
            }
            return c;
          })
        );
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
    switch (channel?.toLowerCase()) {
      case 'instagram':
        return <Camera className="w-3.5 h-3.5 text-pink-400" />;
      case 'whatsapp':
        return <Phone className="w-3.5 h-3.5 text-green-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <div className="flex h-full bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      {/* LEFT PANE: Queue */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-white">Inbox</h2>
            <span className="text-[11px] font-mono text-white/40">
              {filteredConversations.length} chats
            </span>
          </div>

          {/* Channel Filter Buttons: ALL, WHATSAPP, INSTAGRAM, EMAIL (Above Search Bar) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => handleSelectChannel('all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                channelFilter === 'all'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>All ({conversations.length})</span>
              {totalUnreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-accent-gold text-black font-semibold">
                  {totalUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectChannel('whatsapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                channelFilter === 'whatsapp'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'text-white/40 hover:text-green-300 hover:bg-green-500/10'
              }`}
            >
              <Phone className="w-3 h-3 text-green-400" />
              <span>WhatsApp ({waCount})</span>
              {waUnreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-green-500 text-black font-semibold">
                  {waUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectChannel('instagram')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                channelFilter === 'instagram'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : 'text-white/40 hover:text-pink-300 hover:bg-pink-500/10'
              }`}
            >
              <Camera className="w-3 h-3 text-pink-400" />
              <span>Instagram ({igCount})</span>
              {igUnreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-pink-500 text-white font-semibold">
                  {igUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectChannel('email')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                channelFilter === 'email'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-white/40 hover:text-blue-300 hover:bg-blue-500/10'
              }`}
            >
              <Mail className="w-3 h-3 text-blue-400" />
              <span>Email ({emailCount})</span>
              {emailUnreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500 text-white font-semibold">
                  {emailUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Conversation Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests or messages..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => {
            const unreadCount = getConvUnreadCount(conv);
            const isUnread = unreadCount > 0;
            const channelLower = conv.channel?.toLowerCase() || 'chat';

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-colors relative ${
                  activeId === conv.id
                    ? 'bg-white/10 border-l-2 border-l-accent-gold'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="shrink-0">{getChannelIcon(conv.channel)}</span>
                    <p className="text-sm font-medium text-white truncate">
                      {conv.guest_profiles?.full_name || 'Guest'}
                    </p>
                    {isUnread && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-gold opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-gold"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 whitespace-nowrap">
                    {safeFormatDate(conv.updated_at || conv.created_at, 'MMM dd')}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium ${
                      channelLower === 'whatsapp'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : channelLower === 'instagram'
                        ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                        : channelLower === 'email'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    {channelLower}
                  </span>
                  <p className="text-xs text-accent-gold truncate">{conv.subject}</p>
                </div>

                <p className="text-xs text-white/50 truncate">
                  {conv.conversation_messages?.[conv.conversation_messages.length - 1]?.content ||
                    'No messages'}
                </p>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-white/30 text-xs">
              {channelFilter === 'instagram'
                ? 'No Instagram inquiries found yet.'
                : channelFilter === 'whatsapp'
                ? 'No WhatsApp inquiries found yet.'
                : 'No conversations found.'}
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
              <span
                className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded-sm border ${
                  activeConv.status === 'open'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : activeConv.status === 'snoozed'
                    ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
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
                          {safeFormatDate(msg.created_at, 'HH:mm')}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-white/10 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none'
                        }`}
                      >
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
                    <span className="text-[10px] uppercase tracking-widest text-white/40">
                      Reply via:
                    </span>
                    <select
                      value={replyChannel}
                      onChange={(e) => setReplyChannel(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="whatsapp" className="bg-black text-white">
                        WhatsApp
                      </option>
                      <option value="instagram" className="bg-black text-white">
                        Instagram
                      </option>
                      <option value="email" className="bg-black text-white">
                        Email
                      </option>
                      <option value="sms" className="bg-black text-white">
                        SMS
                      </option>
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
              <h3 className="font-serif text-xl text-white mb-1">
                {activeConv.guest_profiles?.full_name || 'Guest'}
              </h3>
              <p className="text-xs text-white/50 font-mono">
                ID: {activeConv.guest_profiles?.id?.split('-')[0]}
              </p>
            </div>

            <div className="space-y-3 border-t border-white/5 pt-6">
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                Verification Protocol
              </p>
              {activeConv.guest_profiles?.is_verified ? (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </div>
                  <span className="text-[10px] text-green-400/50">
                    {activeConv.guest_profiles?.document_number}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" /> Unverified
                  </div>
                  <button className="text-[10px] text-white hover:text-accent-gold transition-colors">
                    Resend Link
                  </button>
                </div>
              )}
            </div>

            {activeConv.bookings && (
              <div className="space-y-3 border-t border-white/5 pt-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">
                    Current Booking
                  </p>
                  <Link href={`/admin/bookings`} className="text-[10px] text-accent-gold hover:underline">
                    View All
                  </Link>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
                  <p className="text-sm text-white font-medium">
                    {activeConv.bookings.spaces?.title}
                  </p>
                  <p className="text-xs text-white/50">
                    {safeFormatDate(activeConv.bookings.check_in, 'MMM dd')} -{' '}
                    {safeFormatDate(activeConv.bookings.check_out, 'MMM dd, yyyy')}
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
