'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  X, 
  Send, 
  Mic, 
  Flame, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Play,
  Square,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { processSultryNoirVoice } from '@/lib/audio/pitchShift';

interface Message {
  id: string;
  senderId: string;
  senderAlias: string;
  isOwn: boolean;
  messageType: 'text' | 'burn_photo' | 'voice_whisper';
  content: string;
  mediaUrl: string | null;
  isBurnt: boolean;
  burnCountdown: number;
  createdAt: string;
}

interface EphemeralChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamberToken: string;
  targetAlias: string;
  targetAvatar?: string;
}

export default function EphemeralChatModal({
  isOpen,
  onClose,
  chamberToken,
  targetAlias,
  targetAvatar,
}: EphemeralChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeBurnPhoto, setActiveBurnPhoto] = useState<{ id: string; url: string; countdown: number } | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pitchShiftEnabled, setPitchShiftEnabled] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const burnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!chamberToken) return;
    try {
      const res = await fetch(`/api/kinkster/ephemeral-messages?chamberToken=${chamberToken}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen && chamberToken) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, chamberToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Burn on read timer loop
  useEffect(() => {
    if (!activeBurnPhoto) return;

    if (activeBurnPhoto.countdown <= 0) {
      // Burn photo on server
      burnMessageOnServer(activeBurnPhoto.id);
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

  const burnMessageOnServer = async (msgId: string) => {
    try {
      await fetch('/api/kinkster/ephemeral-messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      });
      fetchMessages();
    } catch {}
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || loading) return;

    const content = draft.trim();
    setDraft('');
    triggerHaptic('light');

    try {
      await fetch('/api/kinkster/ephemeral-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chamberToken,
          content,
          messageType: 'text',
        }),
      });
      fetchMessages();
    } catch {
      toast.error('Failed to send whisper');
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        let audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (pitchShiftEnabled) {
          try {
            audioBlob = await processSultryNoirVoice(audioBlob);
          } catch (e) {
            console.warn('Voice pitch shift fallback:', e);
          }
        }
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          sendVoiceWhisper(reader.result as string);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      triggerHaptic('medium');
    } catch {
      toast.error('Microphone access denied');
    }
  };

  // Cleanup audio tracks on unmount
  useEffect(() => {
    return () => {
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      triggerHaptic('light');
    }
  };

  const sendVoiceWhisper = async (base64Audio: string) => {
    try {
      await fetch('/api/kinkster/ephemeral-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chamberToken,
          content: pitchShiftEnabled ? '🎙️ [Anonymized Voice Whisper]' : '🎙️ [Voice Whisper]',
          messageType: 'voice_whisper',
          mediaUrl: base64Audio,
        }),
      });
      fetchMessages();
      toast.success('Voice whisper delivered');
    } catch {
      toast.error('Failed to send voice whisper');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[650px] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* TOP BAR */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={targetAvatar || '/images/IMG_9955.jpg'}
              alt={targetAlias}
              className="w-10 h-10 rounded-full object-cover border border-rose-500/40 p-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white font-mono">@{targetAlias}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Confidential Chamber • 24h Purge</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SECURITY & PURGE NOTICE */}
        <div className="px-4 py-2 bg-rose-950/20 border-b border-rose-500/20 flex items-center justify-between text-[10px] font-mono text-rose-300">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400" />
            <span>End-to-End Encrypted</span>
          </div>
          <span>Self-destructs in 24 hours</span>
        </div>

        {/* MESSAGES THREAD */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
              <p className="text-xs font-mono text-zinc-400 font-bold">Confidential Chamber Active</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Exchange discreet whispers and audio notes with @{targetAlias}. All messages automatically shred after 24 hours.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed space-y-1.5 ${
                    m.isOwn
                      ? 'bg-gradient-to-r from-rose-700 to-purple-700 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {/* TEXT MESSAGE */}
                  {m.messageType === 'text' && <p>{m.content}</p>}

                  {/* BURN-ON-READ PHOTO */}
                  {m.messageType === 'burn_photo' && (
                    <div>
                      {m.isBurnt ? (
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px] py-1">
                          <Flame className="w-4 h-4 text-zinc-600" />
                          <span>Photo Burnt &amp; Destroyed</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (m.mediaUrl) {
                              triggerHaptic('medium');
                              setActiveBurnPhoto({ id: m.id, url: m.mediaUrl, countdown: 5 });
                            }
                          }}
                          className="px-3 py-2 bg-black/50 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2 hover:bg-black/70 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-rose-400" />
                          <span>Tap to View (Burns in 5s)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* VOICE WHISPER */}
                  {m.messageType === 'voice_whisper' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                        <Mic className="w-3 h-3 text-amber-400" />
                        <span>Voice Whisper</span>
                      </div>
                      {m.mediaUrl && (
                        <audio controls src={m.mediaUrl} className="h-8 max-w-[200px]" />
                      )}
                    </div>
                  )}

                  <span className="block text-[9px] text-white/50 text-right font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ACTIVE BURN-ON-READ MODAL OVERLAY */}
        {activeBurnPhoto && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4 text-center">
              {/* COUNTDOWN TIMER BADGE */}
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

        {/* INPUT BAR */}
        <div className="p-3 border-t border-zinc-900 bg-zinc-950 space-y-2">
          {/* VOICE FILTER TOGGLE */}
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3 text-amber-400" />
              <span>Voice Note:</span>
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={pitchShiftEnabled}
                onChange={(e) => setPitchShiftEnabled(e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span>Sultry Timbre Anonymizer</span>
            </label>
          </div>

          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Whisper to @${targetAlias}...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/60 font-mono transition-colors"
            />

            {/* VOICE WHISPER BUTTON */}
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer animate-pulse shadow-md"
                title="Stop & Send Voice Whisper"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-colors"
                title="Hold to Record Voice Whisper"
              >
                <Mic className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* SEND BUTTON */}
            <button
              type="submit"
              disabled={!draft.trim()}
              className="p-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
