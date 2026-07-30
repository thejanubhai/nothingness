'use client';

import React from 'react';
import { X, HeartHandshake, ShieldCheck, Sparkles, AlertCircle, Info, Calendar } from 'lucide-react';

export interface HealthBadge {
  id: string;
  type: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  explanation: string;
}

interface HealthBadgeModalProps {
  badge: HealthBadge | null;
  onClose: () => void;
}

export default function HealthBadgeModal({ badge, onClose }: HealthBadgeModalProps) {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            {badge.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{badge.title}</h3>
            <span className="text-[11px] font-mono text-rose-400">Verified Health Parameter</span>
          </div>
        </div>

        {/* Short Description */}
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-4 text-xs text-zinc-300">
          {badge.description}
        </div>

        {/* Detailed Human Explanation */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            <Info className="w-4 h-4 text-rose-400" />
            Medical &amp; Discretion Context
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-4 rounded-xl border border-zinc-900">
            {badge.explanation}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border border-zinc-800 transition-all"
        >
          Understood &amp; Close
        </button>
      </div>
    </div>
  );
}
