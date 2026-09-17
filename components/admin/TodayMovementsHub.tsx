'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  Send, 
  ArrowRight,
  User,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface MovementBooking {
  id: string;
  guest_name?: string;
  guest_phone?: string;
  status: string;
  check_in?: string;
  check_out?: string;
  spaces?: {
    id?: string;
    title?: string;
  } | Array<{ id?: string; title?: string }>;
}

interface TodayMovementsHubProps {
  todayDateStr: string;
  arrivals: MovementBooking[];
  departures: MovementBooking[];
}

export default function TodayMovementsHub({
  todayDateStr,
  arrivals,
  departures,
}: TodayMovementsHubProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'arrivals' | 'departures'>('all');

  // Identify Turnover Squeeze: Spaces where someone is checking out AND checking in today
  const getSpaceTitle = (b: MovementBooking) => {
    if (Array.isArray(b.spaces)) return b.spaces[0]?.title || 'Sanctuary';
    return b.spaces?.title || 'Sanctuary';
  };

  const arrivalSpaceTitles = new Set(arrivals.map(getSpaceTitle));
  const departureSpaceTitles = new Set(departures.map(getSpaceTitle));
  const squeezedSpaces = Array.from(arrivalSpaceTitles).filter((title) =>
    departureSpaceTitles.has(title)
  );

  const generateWaMessage = (guestName?: string, spaceTitle?: string) => {
    const name = guestName || 'Esteemed Guest';
    const space = spaceTitle || 'The Sanctuary';
    return `Namaste ${name}! ✨ Welcome to Nothingness (${space}).\n\nYour check-in is scheduled for today. As part of our autonomous private protocol:\n• Check-in time: 14:00 onwards\n• Key protocol: Your physical key is secured at the confidential spot at the entrance.\n• Caretaker assistance is available on call for any amenity guidance.\n\nWishing you a deeply restorative experience.`;
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Concierge check-in message copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const totalMovements = arrivals.length + departures.length;
  if (totalMovements === 0) return null;

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-zinc-900/60 border border-accent-gold/20 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background ambient gold aura */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
              Today&apos;s Sanctuary Movements
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                {todayDateStr}
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              {arrivals.length} Arrival(s) • {departures.length} Departure(s)
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 self-start sm:self-auto text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-accent-gold text-black font-bold shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All ({totalMovements})
          </button>
          <button
            onClick={() => setFilter('arrivals')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'arrivals'
                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Arrivals ({arrivals.length})
          </button>
          <button
            onClick={() => setFilter('departures')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'departures'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Departures ({departures.length})
          </button>
        </div>
      </div>

      {/* Squeezed Turnover Warning Banner */}
      {squeezedSpaces.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">Turnover Priority Squeeze: </span>
              <span>
                {squeezedSpaces.join(', ')} has same-day departure &amp; arrival. Ensure caretaker turnover is dispatched immediately.
              </span>
            </div>
          </div>
          <Link
            href="/admin/housekeeping"
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors"
          >
            View Housekeeping
          </Link>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Arrivals */}
        {(filter === 'all' || filter === 'arrivals') &&
          arrivals.map((b) => {
            const spaceTitle = getSpaceTitle(b);
            const cleanDigits = (b.guest_phone || '').replace(/[^0-9]/g, '');
            const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
            const waText = generateWaMessage(b.guest_name, spaceTitle);
            const isCopied = copiedId === b.id;

            return (
              <div
                key={`arr-${b.id}`}
                className="bg-black/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {b.guest_name || 'Direct Guest'}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold shrink-0">
                      Check-In Today
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 font-mono flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-white/40" />
                    <span>{spaceTitle}</span>
                    {b.guest_phone && (
                      <>
                        <span>•</span>
                        <span>{b.guest_phone}</span>
                      </>
                    )}
                  </p>

                  <p className="text-[10px] text-emerald-400/90 font-mono mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Secret Key Placed • Contactless Check-In Ready
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(b.id, waText)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
                    title="Copy personalized AI check-in directions"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-accent-gold" />
                        <span>Copy Directions</span>
                      </>
                    )}
                  </button>

                  {b.guest_phone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-mono font-bold transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Guest</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

        {/* Departures */}
        {(filter === 'all' || filter === 'departures') &&
          departures.map((b) => {
            const spaceTitle = getSpaceTitle(b);

            return (
              <div
                key={`dep-${b.id}`}
                className="bg-black/60 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {b.guest_name || 'Guest'}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold shrink-0">
                      Check-Out (11:00 AM)
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 font-mono flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-white/40" />
                    <span>{spaceTitle}</span>
                  </p>

                  <p className="text-[10px] text-rose-300/80 font-mono mt-2">
                    Turnover cleaning &amp; linen reset required before next check-in.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-white/5">
                  <Link
                    href="/admin/housekeeping"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors"
                  >
                    <span>Inspect Turnover</span>
                    <ArrowRight className="w-3 h-3 text-accent-gold" />
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
