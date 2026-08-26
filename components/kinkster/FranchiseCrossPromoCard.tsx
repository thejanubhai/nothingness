'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';

export default function FranchiseCrossPromoCard() {
  return (
    <div className="my-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-125" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>VIP Host Invitation</span>
          </div>

          <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Discreet &amp; Autonomous</span>
          </span>
        </div>

        <div>
          <h3 className="font-serif text-xl sm:text-2xl text-white font-bold leading-tight mb-2">
            Own a Luxury Space in Delhi NCR, Mumbai, or Goa?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Partner with Nothingness to run an ultra-discreet, high-yield sanctuary. We provide turnkey smart lockbox infrastructure, automated turnover inspection, strict Delhi Police guest vetting, and 200%+ higher yields compared to standard rentals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] font-mono text-zinc-300">
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            <span>200%+ Higher RevPAR</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>₹10,000 Deposit Guarantee</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2.5 rounded-xl">
            <Building2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Autonomous Hospitality</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/franchise"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-white hover:to-white text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95"
          >
            <span>Become a Sanctuary Host &amp; Partner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
