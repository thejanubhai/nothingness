'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MapPin, 
  Ticket, 
  AlertTriangle, 
  Send, 
  X, 
  HeartHandshake, 
  EyeOff, 
  Sparkles,
  PhoneCall,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';

interface SanctuaryEvent {
  id: string;
  title: string;
  tagline?: string;
  tier: string;
  event_date: string | null;
  consent_marshall_name?: string;
  spaces?: {
    title: string;
    city: string;
  };
}

interface EventApplication {
  id: string;
  event_id: string;
  category: string;
  status: string;
  qr_secret_token: string;
}

interface NightOfConsentHUDProps {
  event: SanctuaryEvent;
  application: EventApplication;
  userAlias: string;
  onOpenTicket: () => void;
}

export default function NightOfConsentHUD({
  event,
  application,
  userAlias,
  onOpenTicket,
}: NightOfConsentHUDProps) {
  const [showSosModal, setShowSosModal] = useState(false);
  const [alertType, setAlertType] = useState('marshall_assist');
  const [locationHint, setLocationHint] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleSendSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    triggerHaptic('warning');

    try {
      const res = await fetch(`/api/events/${event.id}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType,
          locationHint: locationHint.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Discreet Support Alert Dispatched', {
          description: 'A Floor Marshall has received your alert and will approach discreetly.',
        });
        setShowSosModal(false);
        setLocationHint('');
        setNotes('');
      } else {
        toast.error(data.error || 'Failed to dispatch SOS alert');
      }
    } catch {
      toast.error('Network error while dispatching alert. Please notify floor staff directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/30 border-2 border-rose-500/40 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient glowing pulse */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-rose-500/20 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Night-Of Sanctuary Active • In Session
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-white flex items-center gap-2">
            {event.title}
          </h2>
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{event.spaces?.title || 'Sanctuary Suite'} • Floor Lead: {event.consent_marshall_name || 'Aria'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenTicket}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>Pass QR &amp; Door Codes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Discreet Marshall SOS</span>
          </button>
        </div>
      </div>

      {/* Safety & Sanctuary Rules Quick Bar */}
      <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400 relative z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>Consent is non-negotiable</span>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Phones strictly sealed</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-4 cursor-pointer"
        >
          {showRules ? 'Hide Sanctuary Conduct' : 'View Sanctuary Conduct & Safe Words →'}
        </button>
      </div>

      {/* Expandable Conduct Guide */}
      {showRules && (
        <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-zinc-800 text-xs text-zinc-300 space-y-2 animate-in fade-in duration-200">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Nothingness Sanctuary Inviolable Rules:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-[11px] text-zinc-400 font-mono">
            <li><strong className="text-zinc-200">Continuous Verbal Consent:</strong> A yes to one interaction is not a yes to another. Any &ldquo;No&rdquo;, hesitation, or body tension means an immediate stop.</li>
            <li><strong className="text-zinc-200">Zero Photography:</strong> Phone cameras must remain sealed inside discreet sanctuary pouches. Removing tamper tape triggers immediate removal and lifetime ban.</li>
            <li><strong className="text-zinc-200">Floor Marshalls:</strong> Marshalls wear discreet velvet armbands and are situated around all sanctuary zones. Tap them or use this HUD for immediate support.</li>
          </ul>
        </div>
      )}

      {/* DISCREET SOS MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowSosModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>Discreet Floor Marshall Support</span>
              </div>
              <p className="text-xs text-zinc-400">
                Floor staff will approach your vicinity casually without drawing attention or causing a scene.
              </p>
            </div>

            <form onSubmit={handleSendSos} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-semibold text-zinc-300">
                  Select Assistance Type:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'marshall_assist', label: 'Discreet check-in by Marshall near me' },
                    { id: 'boundary_alert', label: 'Consent boundary or comfort concern' },
                    { id: 'escort_request', label: 'Quiet escort to sanctuary lounge or exit' },
                    { id: 'medical_water', label: 'Hydration, water or physical comfort' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        alertType === opt.id
                          ? 'bg-rose-500/15 border-rose-500/50 text-white font-medium'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="alertType"
                        value={opt.id}
                        checked={alertType === opt.id}
                        onChange={(e) => setAlertType(e.target.value)}
                        className="accent-rose-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">
                  Where are you in the venue? (e.g. Lounge bar, patio, main floor):
                </label>
                <input
                  type="text"
                  value={locationHint}
                  onChange={(e) => setLocationHint(e.target.value)}
                  placeholder="E.g. Near the velvet bar / Courtyard..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">
                  Optional note for Marshall:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything specific the team should know..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Dispatch Support</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
