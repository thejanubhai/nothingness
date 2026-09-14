'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, CheckCircle2, X, ArrowRight, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface SanctuaryPassBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  passPrice?: number;
  onSuccess?: () => void;
}

export default function SanctuaryPassBuyModal({
  isOpen,
  onClose,
  passPrice = 1499,
  onSuccess,
}: SanctuaryPassBuyModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleBuyPass = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sanctuary-pass/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate Sanctuary Pass order.');
      }

      // Auto-submit standard PayU form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;

      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value || '');
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      toast.error('Pass Order Error', { description: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lifetime Portal Access Key</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold tracking-tight">
              Nothingness <span className="text-amber-400">Sanctuary Pass</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              One-time acquisition unlocking confidential access to all official Nothingness Gatherings, Salons, Noir Masquerades, and Intimate Soirées.
            </p>
          </div>

          {/* Pricing Highlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">One-Time Fee</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-white font-mono">₹{passPrice.toLocaleString()}</span>
                <span className="text-xs text-amber-400/80 font-mono">/ Lifetime</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold rounded-lg">
                Gateway Audit-Safe
              </span>
            </div>
          </div>

          {/* Key Privileges */}
          <div className="space-y-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Passholder Privileges</p>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Confidential portal access to all 3 Gathering Tiers (Munches, Raves, Soirées).</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>AI Concierge fast-track vetting &amp; dynamic ratio waitlist priority.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Direct lockscreen push alerts for secret coordinates &amp; entry QR passcodes.</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              onClick={handleBuyPass}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Connecting to Secure Gateway...</span>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Acquire Lifetime Pass (₹{passPrice.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-zinc-500 mt-2.5 font-mono">
              Processed securely via PayU (Cards, UPI, NetBanking) • Statement Descriptor: <strong className="text-zinc-400">PAYU*NOTHINGNESS</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
