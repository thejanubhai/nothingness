'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Lock, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  media_url?: string;
  is_view_once?: boolean;
  created_at: string;
}

interface KinksterInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlias: string;
}

export default function KinksterInboxDrawer({ isOpen, onClose, targetAlias }: KinksterInboxDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiver, setReceiver] = useState<any>(null);

  const fetchThread = async () => {
    if (!targetAlias) return;
    try {
      const res = await fetch(`/api/kinkster/chat?alias=${encodeURIComponent(targetAlias)}`);
      const data = await res.json();
      if (res.ok) {
        setReceiver(data.receiver);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading chat thread:', err);
    }
  };

  useEffect(() => {
    if (isOpen && targetAlias) {
      fetchThread();
    }
  }, [isOpen, targetAlias]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_alias: targetAlias,
          message: inputMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setInputMessage('');
      fetchThread();
    } catch (err: any) {
      toast.error(err.message || 'Could not send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <img
            src={receiver?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover border border-rose-500/40"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white font-mono">@{targetAlias}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" /> Sandboxed App Discretion
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Discretion Warning Banner */}
      <div className="bg-rose-950/20 border-b border-rose-500/20 p-2.5 px-4 text-[11px] text-rose-300 flex items-center gap-2 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        Phone numbers &amp; identity are 100% encrypted &amp; hidden.
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-black/40">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            <Lock className="w-8 h-8 text-rose-400/50 mx-auto mb-2" />
            <p>Start a discreet private conversation with <span className="font-mono text-zinc-300">@{targetAlias}</span>.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.receiver_id !== receiver?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[9px] text-zinc-600 font-mono mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Footer with Mobile Safe Area */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <input
          type="text"
          placeholder={`Message @${targetAlias}...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-xs"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="p-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
