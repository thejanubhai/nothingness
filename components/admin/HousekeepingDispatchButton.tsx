'use client';

import { useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function HousekeepingDispatchButton() {
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatch = async () => {
    setIsDispatching(true);
    toast.loading('Triggering automated WhatsApp cleaner dispatch...');
    try {
      const res = await fetch('/api/admin/housekeeping/dispatch', { method: 'POST' });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        toast.success(`WhatsApp dispatch complete! Alerted ${data.dispatchedCount || 0} cleaners.`);
        window.location.reload();
      } else {
        toast.error(data.error || 'Dispatch failed');
      }
    } catch {
      toast.dismiss();
      toast.error('Network error triggering dispatch');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <button
      onClick={handleDispatch}
      disabled={isDispatching}
      className="flex items-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-black px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
    >
      {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {isDispatching ? 'Dispatching...' : 'Auto-Dispatch WhatsApp Alerts'}
    </button>
  );
}
