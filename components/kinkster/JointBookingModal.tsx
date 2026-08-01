'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Lock, ShieldCheck, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Space {
  id: string;
  title: string;
  slug: string;
  price_per_night: number;
  city: string;
}

interface JointBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlias: string;
}

export default function JointBookingModal({ isOpen, onClose, targetAlias }: JointBookingModalProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/spaces')
        .then(res => res.json())
        .then(data => {
          if (data.spaces && data.spaces.length > 0) {
            setSpaces(data.spaces);
            setSelectedSpaceId(data.spaces[0].id);
          }
        })
        .catch(err => console.error('Error fetching spaces for joint booking:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReserveJointStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      toast.error('Please select valid check-in and check-out dates.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_alias: targetAlias,
          message: `🔑 Joint Sanctuary Booking Reserved! Dates: ${checkIn} to ${checkOut}. Check-in lockbox instructions will be dispatched to both our accounts.`
        })
      });

      if (!res.ok) throw new Error('Failed to dispatch joint reservation message');

      toast.success(`Joint Sanctuary Stay Reserved with @${targetAlias}!`, {
        description: 'Both accounts will receive digital check-in codes.'
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Joint booking error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Reserve Joint Sanctuary Stay</h3>
            <p className="text-xs text-zinc-400">Direct discreet booking with @{targetAlias}</p>
          </div>
        </div>

        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs text-rose-300 mb-6 flex items-start gap-2 font-mono">
          <Lock className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <span>
            Encrypted Joint Stay: Real names remain 100% confidential. Both members receive digital WhatsApp check-in keys under their @aliases.
          </span>
        </div>

        <form onSubmit={handleReserveJointStay} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Select Luxury Sanctuary
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.city}) — ₹{s.price_per_night?.toLocaleString('en-IN')}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Check-In Date
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Check-Out Date
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !checkIn || !checkOut}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Processing Joint Booking...' : 'Reserve Joint Sanctuary Stay'}
          </button>
        </form>
      </div>
    </div>
  );
}
