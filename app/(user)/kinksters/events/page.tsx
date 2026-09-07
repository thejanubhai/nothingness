'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Compass, 
  ArrowLeft,
  Clock,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';

interface KinksterEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string;
  max_capacity: number;
  kinkster_profiles?: {
    alias: string;
    avatar_url: string;
    is_trusted_host?: boolean;
  };
  spaces?: {
    title: string;
    city: string;
    images?: string[];
  };
}

export default function KinksterEventsPage() {
  const [events, setEvents] = useState<KinksterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpdEventIds, setRsvpdEventIds] = useState<Set<string>>(new Set());

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRsvp = (eventId: string, title: string) => {
    setRsvpdEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        toast.info('RSVP cancelled for ' + title);
      } else {
        next.add(eventId);
        toast.success('Discreet RSVP Confirmed! ✨', {
          description: 'Secret arrival coordinates will be dispatched on day of gathering.'
        });
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 sm:pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-mono mb-1">
            <Sparkles className="w-4 h-4" /> Confidential Lifestyle Gatherings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 bg-clip-text text-transparent">
            Secret Soirées &amp; Munches
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Curated Munches, Noir Masquerades, and Shibari Salons for vetted members. Exact sanctuary suite addresses released 4 hours prior.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kinksters"
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Feed</span>
          </Link>

          <Link
            href="/kinksters/discover"
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Discover</span>
          </Link>

          <Link
            href="/sanctuary-pass"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Ticket className="w-4 h-4" />
            <span>Sanctuary Passes ✨</span>
          </Link>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No Upcoming Soirées Scheduled</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Our hosts are finalizing dates for the next Velvet Masquerade. Check back shortly or view Sanctuary Passes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const isRsvpd = rsvpdEventIds.has(evt.id);
            const evtDate = new Date(evt.event_date);
            const dateStr = evtDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = evtDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={evt.id}
                className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Space Image Banner if available */}
                  <div className="relative h-44 bg-zinc-900 overflow-hidden">
                    <img
                      src={
                        evt.spaces?.images?.[0] ||
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800'
                      }
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    {/* Date Badge */}
                    <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{dateStr}  {timeStr}</span>
                    </div>

                    {/* Capacity Badge */}
                    <div className="absolute top-3.5 right-3.5 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                      <Users className="w-3 h-3 text-rose-400" />
                      <span>Limit: {evt.max_capacity} Guests</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white font-serif group-hover:text-amber-300 transition-colors">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {/* Host & Location Metadata */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-900 text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{evt.location_name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Host: @{evt.kinkster_profiles?.alias || 'sanctuary'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer RSVP Action */}
                <div className="p-5 sm:p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleRsvp(evt.id, evt.title)}
                    className={`w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isRsvpd
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-extrabold'
                    }`}
                  >
                    {isRsvpd ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>RSVP Confirmed  You are on the Guestlist</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>Reserve Discreet RSVP Space</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
