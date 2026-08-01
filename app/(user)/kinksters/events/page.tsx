'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Users, ShieldCheck, Plus, Lock, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface SoireeEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string;
  max_capacity: number;
  is_admin_approved: boolean;
  kinkster_profiles?: {
    alias: string;
    avatar_url: string;
    is_trusted_host: boolean;
  };
  spaces?: {
    title: string;
    city: string;
  };
}

export default function SanctuaryEventsPage() {
  const [events, setEvents] = useState<SoireeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(12);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching secret events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/kinkster/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          event_date: eventDate,
          max_capacity: maxCapacity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Event creation failed');

      toast.success('Sanctuary Soirée event created successfully!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Event creation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-rose-400 font-mono mb-1">
            <Ticket className="w-4 h-4" /> Secret Lounge &amp; Private Gatherings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
            Sanctuary Soirées
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Invite-only discreet gatherings hosted exclusively by Nothingness Admin-Approved Trusted Hosts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Host Soirée (Trusted Host Only)
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs font-mono animate-pulse text-zinc-500">
          Loading secret events...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-2xl p-8">
          <Sparkles className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Upcoming Secret Soirées</h3>
          <p className="text-xs text-zinc-500 mt-1">Check back soon for upcoming invite-only lounge gatherings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 rounded-2xl p-6 shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono font-bold rounded-full flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    {new Date(evt.event_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    Limit {evt.max_capacity} Guests
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{evt.title}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed mb-4">{evt.description}</p>

                {/* Host Info */}
                <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl mb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={evt.kinkster_profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                      alt="Host Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-rose-500/40"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold font-mono text-white">@{evt.kinkster_profiles?.alias}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[9px] text-zinc-400">Admin-Approved Trusted Host</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-rose-300 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-md">
                    Verified Host
                  </span>
                </div>
              </div>

              {/* RSVP Action */}
              <button
                onClick={() => toast.success(`RSVP Request sent for "${evt.title}"!`, { description: 'Discreet location address will be dispatched to your WhatsApp.' })}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Ticket className="w-4 h-4" />
                Request Discretion RSVP
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Host New Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Host Sanctuary Soirée</h3>
            <p className="text-xs text-zinc-400 mb-4">Strictly restricted to Admin-Approved Trusted Hosts.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Velvet Masked Lounge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the aesthetic, dress code, and vibe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-zinc-900 text-zinc-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
