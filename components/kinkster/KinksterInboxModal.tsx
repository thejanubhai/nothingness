'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Calendar,
  Users,
  Search, 
  RefreshCw,
  UserCheck,
  UserX,
  ShieldAlert,
  Inbox,
  Flame,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import KinksterInboxDrawer from '@/components/kinkster/KinksterInboxDrawer';

interface ConversationItem {
  id: string;
  type: string;
  title: string;
  alias: string;
  avatar_url: string;
  bio: string;
  is_vetted: boolean;
  context_type?: string | null;
  context_id?: string | null;
  context_data?: Record<string, any>;
  last_message: string;
  last_message_time?: string;
  unread_count: number;
  retention_policy?: string | null;
  expires_at?: string | null;
  is_muted?: boolean;
  status: string;
}

interface MessageRequestItem {
  conversation_id: string;
  sender: {
    alias: string;
    avatar_url: string;
    bio: string;
    is_in_person_vetted: boolean;
  };
  last_message: string;
  last_message_time?: string;
  context?: {
    title: string;
    subtitle?: string;
    badge?: string;
  } | null;
  created_at: string;
}

interface KinksterInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshUnread?: () => void;
}

type TabType = 'all' | 'requests' | 'people' | 'resonance' | 'events' | 'communities' | 'ephemeral';

export default function KinksterInboxModal({
  isOpen,
  onClose,
  onRefreshUnread,
}: KinksterInboxModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [requests, setRequests] = useState<MessageRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Active chat state
  const [selectedChat, setSelectedChat] = useState<{
    conversationId?: string;
    alias: string;
  } | null>(null);

  // Stealth mode protection
  const [isStealthActive, setIsStealthActive] = useState<boolean>(false);

  useEffect(() => {
    const handleStealth = () => setIsStealthActive(true);
    window.addEventListener('trigger-panic-mode', handleStealth);
    return () => window.removeEventListener('trigger-panic-mode', handleStealth);
  }, []);

  const fetchInboxData = async () => {
    setLoading(true);
    try {
      // 1. Fetch conversations for the active tab
      const chatRes = await fetch(`/api/kinkster/chat?tab=${activeTab}&query=${encodeURIComponent(searchQuery)}`);
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setConversations(chatData.conversations || []);
      }

      // 2. Fetch pending message requests count and items
      const reqRes = await fetch('/api/kinkster/chat/requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (err) {
      console.error('Failed to load inbox data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInboxData();
    }
  }, [isOpen, activeTab]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleOpenConversation = async (conversationId: string, alias: string) => {
    try {
      await fetch('/api/kinkster/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (onRefreshUnread) onRefreshUnread();
    } catch (_) {}

    setSelectedChat({ conversationId, alias });
  };

  const handleRequestAction = async (conversationId: string, action: 'accept' | 'decline' | 'block', targetAlias: string) => {
    setProcessingRequestId(conversationId);
    try {
      const res = await fetch('/api/kinkster/chat/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, action }),
      });

      if (!res.ok) {
        throw new Error('Failed to process request');
      }

      if (action === 'accept') {
        toast.success(`Connected with @${targetAlias}! Direct chat open.`);
        setSelectedChat({ conversationId, alias: targetAlias });
      } else if (action === 'decline') {
        toast.info('Message request dismissed.');
      } else if (action === 'block') {
        toast.info(`@${targetAlias} blocked.`);
      }

      fetchInboxData();
      if (onRefreshUnread) onRefreshUnread();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (!isOpen) return null;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'all', label: 'All', icon: <Inbox className="w-3.5 h-3.5" /> },
    { id: 'requests', label: 'Requests', icon: <UserCheck className="w-3.5 h-3.5" />, badge: requests.length },
    { id: 'people', label: 'People', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'resonance', label: 'Resonance', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-3.5 h-3.5 text-amber-300" /> },
    { id: 'communities', label: 'Communities', icon: <Users className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'ephemeral', label: 'Ephemeral', icon: <Clock className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[70] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Slide-Over Drawer Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className={`relative w-full sm:w-[440px] max-w-full bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col h-full z-10 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
            isStealthActive ? 'filter blur-md select-none pointer-events-none' : ''
          }`}
        >
          {/* Drawer Top Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                  Sanctuary Messages
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      {totalUnread} new
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400" /> Sandboxed Anonymous Channels
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchInboxData}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Refresh Inbox"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="px-4 pt-3 pb-2 border-b border-zinc-900 bg-black/40">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search @alias, conversation, or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInboxData()}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="px-3 py-2 border-b border-zinc-900 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-zinc-900/70 border border-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Drawer Body List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                <span className="text-xs font-mono">Decrypting conversations...</span>
              </div>
            ) : activeTab === 'requests' ? (
              requests.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6">
                  <UserCheck className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white font-mono">No Pending Requests</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    When someone outside your circles requests to message you, it appears here for confidential review.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.conversation_id}
                    className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/30 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.sender.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                          alt={req.sender.alias}
                          className="w-11 h-11 rounded-full object-cover border border-amber-400/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white font-mono">@{req.sender.alias}</span>
                            {req.sender.is_in_person_vetted && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          {req.sender.bio && (
                            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{req.sender.bio}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                        {formatTimeAgo(req.created_at)}
                      </span>
                    </div>

                    {req.context && (
                      <div className="p-2 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-zinc-300">
                        <span className="text-accent-gold font-bold mr-1">{req.context.badge || 'Context'}:</span>
                        <span>{req.context.title}</span>
                      </div>
                    )}

                    {req.last_message && (
                      <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono">
                        "{req.last_message}"
                      </div>
                    )}

                    {/* Safety Actions: Accept / Decline / Block */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={processingRequestId === req.conversation_id}
                        onClick={() => handleRequestAction(req.conversation_id, 'accept', req.sender.alias)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingRequestId === req.conversation_id}
                        onClick={() => handleRequestAction(req.conversation_id, 'decline', req.sender.alias)}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingRequestId === req.conversation_id}
                        onClick={() => handleRequestAction(req.conversation_id, 'block', req.sender.alias)}
                        className="p-2 bg-zinc-900 hover:bg-rose-950 border border-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                        title="Block Member"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              conversations.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6">
                  <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white font-mono">No Conversations Yet</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Start a conversation from member profiles, mutual Resonance in Explore, or shared Events and Communities.
                  </p>
                </div>
              ) : (
                conversations.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleOpenConversation(thread.id, thread.alias)}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.98] ${
                      thread.unread_count > 0
                        ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={thread.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                          alt={thread.alias}
                          className="w-11 h-11 rounded-full object-cover border border-rose-500/30"
                        />
                        {thread.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-black">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-mono truncate">
                            {thread.title}
                          </span>
                          {thread.is_vetted && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {thread.type === 'RESONANCE' && (
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-snug font-mono">
                          {thread.last_message || 'Conversation active'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatTimeAgo(thread.last_message_time)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 mt-1" />
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* Embedded Conversation Detail Drawer */}
      {selectedChat && (
        <KinksterInboxDrawer
          isOpen={!!selectedChat}
          onClose={() => {
            setSelectedChat(null);
            fetchInboxData();
            if (onRefreshUnread) onRefreshUnread();
          }}
          conversationId={selectedChat.conversationId}
          targetAlias={selectedChat.alias}
        />
      )}
    </>
  );
}
