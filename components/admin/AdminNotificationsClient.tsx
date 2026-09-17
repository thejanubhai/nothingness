'use client';

import React, { useState } from 'react';
import { Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminNotificationsClientProps {
  initialSubscriberCount: number;
}

export default function AdminNotificationsClient({
  initialSubscriberCount,
}: AdminNotificationsClientProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Please provide both notification title and message body.');
      return;
    }

    setSending(true);
    toast.loading('Dispatching Web Push broadcast to all active devices...');

    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || '/',
        }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok && data.success) {
        toast.success(`Broadcast delivered to ${data.totalSent || 0} subscriber(s)!`, {
          description: data.totalFailed > 0 ? `${data.totalFailed} stale endpoints purged from Supabase.` : undefined,
        });
        setTitle('');
        setMessage('');
        setUrl('');
      } else {
        toast.error(data.error || 'Failed to dispatch broadcast');
      }
    } catch {
      toast.dismiss();
      toast.error('Network error sending push broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <Send className="w-5 h-5 text-accent-gold" />
        <h2 className="font-serif text-xl text-white font-bold">Compose Push Broadcast</h2>
      </div>

      <form onSubmit={handleSendBroadcast} className="space-y-6 max-w-2xl">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
            Notification Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Sanctuary Suite Launch 🏛️"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
            Message Body
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your broadcast message to all subscribed guests..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50 resize-none"
            maxLength={300}
            required
          />
          <span className="text-[10px] text-white/30 font-mono mt-1 block text-right">
            {message.length} / 300 characters
          </span>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block font-mono">
            Destination URL (Optional)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://nothingness.asia/sanctuary-pass"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 font-mono">
            Will be dispatched to{' '}
            <span className="text-accent-gold font-bold">{subscriberCount || 0}</span> subscribed device(s)
          </p>
          <button
            type="submit"
            disabled={sending || !title.trim() || !message.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-gold hover:bg-white text-black rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
          >
            {sending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
