'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Image as ImageIcon, 
  Building2, 
  Mic, 
  Flame, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Volume2, 
  Square, 
  RefreshCw, 
  Check, 
  CheckCheck,
  Flag,
  ShieldAlert,
  BellOff,
  LogOut,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { processSultryNoirVoice } from '@/lib/audio/pitchShift';
import { createClient } from '@/lib/supabase/client';
import ContextBanner from '@/components/kinkster/messaging/ContextBanner';
import JointBookingModal from '@/components/kinkster/JointBookingModal';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  is_me: boolean;
  message_type: 'text' | 'photo' | 'video' | 'voice' | 'burn_photo' | 'share_post' | 'share_event' | 'share_profile' | 'system';
  content: string;
  media_url?: string | null;
  media_metadata?: Record<string, any>;
  is_view_once?: boolean;
  is_burnt?: boolean;
  burn_countdown_seconds?: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  idempotency_key?: string;
  created_at: string;
}

interface KinksterInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetAlias: string;
}

export default function KinksterInboxDrawer({
  isOpen,
  onClose,
  conversationId: propConversationId,
  targetAlias,
}: KinksterInboxDrawerProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(propConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [receiver, setReceiver] = useState<{ id: string; alias: string; avatar_url: string; bio?: string } | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isBurnOnRead, setIsBurnOnRead] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [showJointBookingModal, setShowJointBookingModal] = useState(false);

  // Active burn photo view overlay
  const [activeBurnPhoto, setActiveBurnPhoto] = useState<{ id: string; url: string; countdown: number } | null>(null);
  const burnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pitchShiftEnabled, setPitchShiftEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversation thread & messages
  const fetchThread = async () => {
    if (!targetAlias && !conversationId) return;
    setLoading(true);
    try {
      let url = '/api/kinkster/chat';
      if (conversationId) {
        url = `/api/kinkster/chat/${conversationId}`;
      } else if (targetAlias) {
        url = `/api/kinkster/chat?alias=${encodeURIComponent(targetAlias)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
        }
        if (data.receiver) {
          setReceiver(data.receiver);
        }
        if (data.context) {
          setContextData(data.context);
        }
        if (data.isMuted !== undefined) {
          setIsMuted(data.isMuted);
        }
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading chat thread:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchThread();
    }
  }, [isOpen, conversationId, targetAlias]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Realtime Supabase Subscription
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kinkster_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            // Check if message already in list (e.g. optimistic or idempotency)
            const exists = prev.some((m) => m.id === newMsg.id || (m.idempotency_key && m.idempotency_key === newMsg.idempotency_key));
            if (exists) {
              return prev.map((m) => (m.id === newMsg.id || m.idempotency_key === newMsg.idempotency_key ? { ...newMsg, is_me: m.is_me } : m));
            }
            return [...prev, { ...newMsg, is_me: false }];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kinkster_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, conversationId]);

  // 3. Burn-on-read timer countdown loop
  useEffect(() => {
    if (!activeBurnPhoto) return;

    if (activeBurnPhoto.countdown <= 0) {
      burnPhotoOnServer(activeBurnPhoto.id);
      setActiveBurnPhoto(null);
      triggerHaptic('warning');
      toast.info('Photo Shredded Permanently');
      return;
    }

    burnTimerRef.current = setTimeout(() => {
      setActiveBurnPhoto((prev) => (prev ? { ...prev, countdown: prev.countdown - 1 } : null));
    }, 1000);

    return () => {
      if (burnTimerRef.current) clearTimeout(burnTimerRef.current);
    };
  }, [activeBurnPhoto]);

  const burnPhotoOnServer = async (messageId: string) => {
    try {
      await fetch('/api/kinkster/ephemeral-messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      fetchThread();
    } catch (_) {}
  };

  // 4. Message sending handler with idempotency & optimistic update
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const content = inputMessage.trim();
    const idempotencyKey = crypto.randomUUID();
    const tempId = `temp_${Date.now()}`;

    // Optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId || '',
      sender_id: 'me',
      is_me: true,
      message_type: isBurnOnRead ? 'burn_photo' : 'text',
      content: content,
      is_view_once: isBurnOnRead,
      status: 'sending',
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputMessage('');
    setSending(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/kinkster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          receiver_alias: targetAlias,
          message: content,
          message_type: isBurnOnRead ? 'burn_photo' : 'text',
          is_view_once: isBurnOnRead,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, is_me: true } : m))
        );
      }
      setIsBurnOnRead(false);
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
      toast.error(err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  // 5. Voice whisper recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        let audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (pitchShiftEnabled) {
          try {
            audioBlob = await processSultryNoirVoice(audioBlob);
          } catch (e) {
            console.warn('Pitch shift fallback:', e);
          }
        }
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          sendVoiceMedia(reader.result as string);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      triggerHaptic('medium');

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied or unavailable.');
    }
  };

  // Cleanup audio tracks and recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch (_) {}
      }
    };
  }, []);

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      triggerHaptic('light');
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast.info('Voice recording discarded');
    }
  };

  const sendVoiceMedia = async (base64Audio: string) => {
    const idempotencyKey = crypto.randomUUID();
    setSending(true);
    try {
      const res = await fetch('/api/kinkster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          receiver_alias: targetAlias,
          message: pitchShiftEnabled ? '🎙️ [Anonymized Voice Whisper]' : '🎙️ [Voice Whisper]',
          media_url: base64Audio,
          message_type: 'voice',
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send voice note');
      fetchThread();
      toast.success('Voice whisper delivered');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send voice whisper');
    } finally {
      setSending(false);
    }
  };

  // 6. Photo upload handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    triggerHaptic('light');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat_media');

      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload photo');
      }

      // Send message with uploaded photo
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/kinkster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          receiver_alias: targetAlias,
          message: isBurnOnRead ? '🔥 [Burn on Read Photo]' : '📷 [Photo]',
          media_url: uploadData.url,
          message_type: isBurnOnRead ? 'burn_photo' : 'photo',
          is_view_once: isBurnOnRead,
          idempotency_key: idempotencyKey,
        }),
      });

      const msgData = await res.json();
      if (!res.ok) throw new Error(msgData.error || 'Failed to send photo');
      fetchThread();
      setIsBurnOnRead(false);
    } catch (err: any) {
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 7. Safety actions: mute, block, report, leave
  const handleSafetyAction = async (action: 'mute' | 'leave' | 'block' | 'report') => {
    if (!conversationId) return;
    try {
      if (action === 'block' && !confirm(`Are you sure you want to block @${targetAlias}?`)) {
        return;
      }

      const res = await fetch(`/api/kinkster/chat/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId: receiver?.id, reason: 'Inappropriate contact' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'mute') {
        setIsMuted(data.is_muted);
        toast.info(data.is_muted ? 'Conversation muted' : 'Conversation unmuted');
      } else if (action === 'leave' || action === 'block') {
        toast.info(action === 'leave' ? 'Left conversation' : `@${targetAlias} blocked`);
        onClose();
      } else if (action === 'report') {
        toast.success('Report submitted confidentially');
      }
      setShowSafetyMenu(false);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full sm:w-[420px] md:max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Drawer Header */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800/90 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={receiver?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover border border-rose-500/40 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white font-mono truncate">@{targetAlias}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-rose-400" /> Sandboxed Channel
              </span>
              {isMuted && <span className="text-amber-400 font-bold">• Muted</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Safety Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSafetyMenu(!showSafetyMenu)}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800/70 transition-colors cursor-pointer"
              title="Safety & Settings"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showSafetyMenu && (
              <div className="absolute right-0 top-10 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-20 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => handleSafetyAction('mute')}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isMuted ? 'Unmute' : 'Mute Thread'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSafetyAction('report')}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-400" />
                  <span>Report Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSafetyAction('block')}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Block @{targetAlias}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSafetyAction('leave')}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl flex items-center gap-2 cursor-pointer border-t border-zinc-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Thread</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Discretion Warning & Reserve Joint Stay Bar */}
      <div className="bg-rose-950/20 border-b border-rose-500/20 p-2.5 px-4 flex items-center justify-between gap-2 text-[11px] text-rose-300 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">Encrypted Discretion Chat</span>
        </div>
        <button
          onClick={() => setShowJointBookingModal(true)}
          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-[10px] rounded-lg shrink-0 flex items-center gap-1 shadow-md cursor-pointer"
        >
          <Building2 className="w-3 h-3" />
          <span>Joint Stay 🔑</span>
        </button>
      </div>

      {/* Context-First Banner */}
      <ContextBanner context={contextData} />

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black/40">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
            <span className="text-xs font-mono">Decrypting thread...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-mono space-y-2">
            <Lock className="w-8 h-8 text-rose-400/50 mx-auto mb-1" />
            <p className="font-bold text-zinc-300">Sanctuary Discretion Active</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Start a discreet private conversation with @{targetAlias}. No third-party tracking.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.is_me;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed space-y-1.5 ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-700 to-purple-700 text-white rounded-br-none shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* TEXT CONTENT */}
                  {msg.message_type === 'text' && <p>{msg.content}</p>}

                  {/* REGULAR PHOTO */}
                  {msg.message_type === 'photo' && msg.media_url && (
                    <div className="rounded-xl overflow-hidden max-w-xs">
                      <img src={msg.media_url} alt="Photo attachment" className="w-full object-cover rounded-xl" />
                      {msg.content && msg.content !== '📷 [Photo]' && (
                        <p className="mt-1 text-xs">{msg.content}</p>
                      )}
                    </div>
                  )}

                  {/* BURN ON READ PHOTO */}
                  {msg.message_type === 'burn_photo' && (
                    <div>
                      {msg.is_burnt ? (
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] py-1">
                          <Flame className="w-4 h-4 text-zinc-500" />
                          <span>Photo Burnt &amp; Destroyed</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.media_url) {
                              triggerHaptic('medium');
                              setActiveBurnPhoto({ id: msg.id, url: msg.media_url, countdown: 5 });
                            }
                          }}
                          className="px-3 py-2 bg-black/60 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2 hover:bg-black/80 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-rose-400" />
                          <span>Tap to View (Burns in 5s)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* VOICE WHISPER */}
                  {msg.message_type === 'voice' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-300">
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span>Voice Whisper</span>
                      </div>
                      {msg.media_url && (
                        <audio controls src={msg.media_url} className="h-8 max-w-[210px] filter invert" />
                      )}
                    </div>
                  )}

                  {/* FOOTER METADATA: Timestamp & Status Receipt */}
                  <div className="flex items-center justify-end gap-1 text-[9px] text-white/50 font-mono pt-0.5">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span>
                        {msg.status === 'sending' && <RefreshCw className="w-2.5 h-2.5 animate-spin text-zinc-400" />}
                        {msg.status === 'sent' && <Check className="w-3 h-3 text-zinc-300" />}
                        {msg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-zinc-300" />}
                        {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-accent-gold" />}
                        {msg.status === 'failed' && (
                          <span
                            onClick={() => handleSendMessage()}
                            className="text-rose-400 cursor-pointer underline flex items-center gap-0.5"
                          >
                            <AlertCircle className="w-2.5 h-2.5" /> Retry
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ACTIVE BURN-ON-READ FULL MODAL OVERLAY */}
      {activeBurnPhoto && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-600 text-white font-mono text-xs font-bold animate-pulse shadow-lg">
              <Clock className="w-4 h-4" />
              <span>Burning in {activeBurnPhoto.countdown} seconds...</span>
            </div>

            <div className="relative aspect-square rounded-3xl overflow-hidden border border-rose-500/40 shadow-2xl">
              <img
                src={activeBurnPhoto.url}
                alt="Burn on read"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-[10px] font-mono text-zinc-500">
              Tamper-resistant • Destroyed from vault upon timer completion
            </p>
          </div>
        </div>
      )}

      {/* Native Message Composer Footer */}
      <div className="p-3 border-t border-zinc-800/90 bg-zinc-950 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* Composer Controls: Voice filter & Burn-on-read toggles */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
          <button
            type="button"
            onClick={() => setIsBurnOnRead(!isBurnOnRead)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              isBurnOnRead
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Burn on Read (5s)</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 text-[10px]">
            <input
              type="checkbox"
              checked={pitchShiftEnabled}
              onChange={(e) => setPitchShiftEnabled(e.target.checked)}
              className="rounded accent-rose-500"
            />
            <span>Noir Voice Filter</span>
          </label>
        </div>

        {/* Recording active banner */}
        {isRecording ? (
          <div className="flex items-center justify-between p-2.5 bg-rose-950/30 border border-rose-500/40 rounded-xl animate-pulse">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Recording Voice Whisper ({recordingSeconds}s)...</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono font-bold rounded-lg cursor-pointer"
              >
                Send Audio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden Photo File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Photo Attachment Button */}
            <button
              type="button"
              disabled={uploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Attach Photo"
            >
              <ImageIcon className={`w-4 h-4 ${uploadingMedia ? 'animate-spin text-rose-400' : ''}`} />
            </button>

            {/* Hold to Record Voice Button */}
            <button
              type="button"
              onClick={startVoiceRecording}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 rounded-xl transition-colors cursor-pointer"
              title="Record Voice Whisper"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Main Text Input */}
            <input
              type="text"
              placeholder={`Message @${targetAlias}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-base md:text-xs font-mono transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="p-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Joint Sanctuary Booking Modal */}
      <JointBookingModal
        isOpen={showJointBookingModal}
        onClose={() => setShowJointBookingModal(false)}
        targetAlias={targetAlias}
      />
    </div>
  );
}
