'use client';

import React from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';

interface InvoiceActionBarProps {
  bookingId: string;
  isPaid: boolean;
}

export default function InvoiceActionBar({ bookingId, isPaid }: InvoiceActionBarProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="print:hidden w-full max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl backdrop-blur-md">
      <Link
        href={`/booking/${bookingId}/verify`}
        className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Check-in Portal</span>
      </Link>

      <div className="flex items-center gap-3">
        {isPaid && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tariff Settled</span>
          </div>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-gold text-black rounded-xl text-xs font-bold font-mono uppercase tracking-wider hover:bg-white transition-colors cursor-pointer shadow-lg"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>
    </div>
  );
}
