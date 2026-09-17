'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, LayoutDashboard, ShieldAlert } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception for audit / monitoring
    console.error('Admin Area Runtime Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950/80 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-white font-bold">
              Operational Exception
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-rose-300">
              Admin Fault-Tolerance Active
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-white/60 font-sans leading-relaxed mb-4">
          A backend query or action encountered an unexpected issue while rendering this administrative module. The system remains secure.
        </p>

        {error.message && (
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 font-mono text-[11px] text-rose-300/90 break-words mb-6 max-h-32 overflow-y-auto">
            {error.message}
            {error.digest && (
              <span className="block text-[9px] text-white/30 mt-1">
                Digest: {error.digest}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-gold hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Module
          </button>

          <Link
            href="/admin"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-accent-gold" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
