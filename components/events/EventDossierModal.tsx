'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  Ticket,
  Play,
  Pause,
  Volume2,
  Users,
  EyeOff,
  Wine,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface EventDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  isLoggedIn: boolean;
  hasSanctuaryPass: boolean;
  onRequestPass: () => void;
  onBuySanctuaryPass: () => void;
}

export default function EventDossierModal({
  isOpen,
  onClose,
  event,
  isLoggedIn,
  hasSanctuaryPass,
  onRequestPass,
  onBuySanctuaryPass,
}: EventDossierModalProps) {
  const [isPlayingSoundscape, setIsPlayingSoundscape] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'dress_code' | 'etiquette' | 'attendees'>('overview');

  if (!isOpen || !event) return null;

  const eventDateStr = new Date(event.event_date).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const displayImage = event.spaces?.images?.[0] || '/images/IMG_9955.jpg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Visual Banner */}
        <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden bg-zinc-900">
          <img
            src={displayImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

          {/* Floating Tier & Timing Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              {event.tier === 'munch' ? 'Tier 1 • Salon & Dialogue' : event.tier === 'rave' ? 'Tier 2 • Noir Masquerade' : 'Tier 3 • Intimate Soirée'}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-zinc-300 text-[10px] font-mono flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-rose-400" />
              {eventDateStr}
            </span>
          </div>

          {/* Title on Banner */}
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-serif tracking-tight leading-tight">
              {event.title}
            </h2>
            <p className="text-xs text-amber-300/90 font-mono">
              {event.tagline || 'Confidential Gathering • South Delhi Sanctuary Suite'}
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-zinc-800/80 px-4 sm:px-6 bg-zinc-950/80 shrink-0 text-xs font-mono">
          {[
            { id: 'overview', label: 'Gathering Dossier' },
            { id: 'dress_code', label: 'Dress Lookbook' },
            { id: 'etiquette', label: 'Safety & Marshalls' },
            { id: 'attendees', label: 'Vetted Guest Roster' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 sm:px-4 font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider mb-2 font-bold">
                  Atmospheric Description
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Secret Location Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    Secret Sanctuary Location
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                    Coordinates Revealed 3 Hours Prior
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  {event.secret_location_address || 'Private multi-level penthouse residence in South Delhi. Exact GPS pin, discreet parking, and entry directions delivered directly to passholders via dynamic QR portal.'}
                </p>
              </div>

              {/* Real-time Attendance & Ratio Meters */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Curated Balance Ratio
                  </span>
                  <span className="text-emerald-400 font-bold">Guaranteed Ratio Equilibrium</span>
                </div>

                <div className="space-y-2 text-[11px] font-mono text-zinc-400">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Couples Passes (Max {event.max_couples || 15})</span>
                      <span className="text-white font-bold">85% Claimed</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-rose-500 to-amber-400 h-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Solo Female Passes (Max {event.max_females || 20})</span>
                      <span className="text-white font-bold">75% Claimed</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-rose-400 h-full w-[75%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Solo Male Passes (Max {event.max_males || 5})</span>
                      <span className="text-amber-400 font-bold">90% Full • Queue Enforced</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[90%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Soundscape Preview Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 to-purple-950/30 border border-rose-500/25 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlayingSoundscape(!isPlayingSoundscape)}
                    className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {isPlayingSoundscape ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">Noir Ambient Soundscape Preview</span>
                    <span className="text-[10px] text-zinc-400">Curated Darkwave &amp; Ambient Vinyl frequencies</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 h-4 px-1">
                  {[0.5, 0.9, 0.4, 1, 0.7, 0.3, 0.8].map((s, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full bg-rose-400 transition-all ${
                        isPlayingSoundscape ? 'animate-pulse' : 'opacity-40'
                      }`}
                      style={{
                        height: isPlayingSoundscape ? `${Math.max(4, s * 16)}px` : '4px',
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRESS LOOKBOOK */}
          {activeTab === 'dress_code' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Required Dress Aesthetic: {event.dress_code || 'Noir Luxury'}
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Our gatherings are atmospheric rituals. Guests who arrive out of dress code are politely requested to change or purchase sanctuary masks at the concierge counter.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2">
                  <span className="text-rose-400 font-bold block">For Women &amp; Femmes</span>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    <li>Velvet, lace, or silk slips</li>
                    <li>Structured leather corsetry</li>
                    <li>Filigree or velvet masquerade masks</li>
                    <li>High-sheen dark textures</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2">
                  <span className="text-purple-400 font-bold block">For Men &amp; Mascs</span>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    <li>Structured black suits or cravats</li>
                    <li>Textured linen shirts (unbuttoned)</li>
                    <li>Matte leather or Venetian half-masks</li>
                    <li>Dress shoes (strictly no sneakers)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ETIQUETTE & MARSHALLS */}
          {activeTab === 'etiquette' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Floor Lead &amp; Consent Marshall: {event.consent_marshall_name || 'Aria & Kael'}
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Dedicated, identifiable floor marshalls are present throughout the gathering. If at any moment you feel uncomfortable or need assistance, they are your sovereign advocates.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300 font-mono">
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-2.5">
                  <EyeOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">
                      {event.tier === 'munch' ? 'Phones Permitted (Social Munch)' : 'Phones Stored Safely Outside Premises'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {event.tier === 'munch'
                        ? 'In Tier 1 Munches, phones are permitted in this relaxed conversational setting where in-person vibe vetting takes place.'
                        : 'Smartphones are safely checked and stored outside the premises prior to entry. Because every attendee is already physically vetted at a Munch, there is zero suspicion or anxiety.'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Enthusiastic Verbal Consent</span>
                    <span className="text-[11px] text-zinc-400">A look or outfit is never consent. Touch and conversations require explicit, ongoing verbal agreement.</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-2.5">
                  <Wine className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Sober Presence &amp; Hydration</span>
                    <span className="text-[11px] text-zinc-400">Intoxication is strictly prohibited. Electrolytes, warm herbal tea, and water stations are continuously available.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VETTED ATTENDEES */}
          {activeTab === 'attendees' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                <span>Guest roster is strictly pseudonymous. Only sovereign @aliases are visible to fellow attendees.</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {[
                  { alias: '@velvet_nocturne', type: 'Switch', badge: '5.0★' },
                  { alias: '@obsidian_silk_duo', type: 'Couple', badge: '4.98★' },
                  { alias: '@aria_shibari', type: 'Rigger', badge: '5.0★' },
                  { alias: '@kinkster_architect', type: 'Dominant', badge: '5.0★' },
                  { alias: '@aurora_sub', type: 'Surrender', badge: '5.0★' },
                  { alias: '@nocturnal_switch', type: 'Explorer', badge: '4.9★' }
                ].map((guest, i) => (
                  <div key={i} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">{guest.alias}</span>
                      <span className="text-[10px] text-zinc-500">{guest.type}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold">{guest.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Pricing & CTA Action */}
        <div className="p-5 sm:p-6 bg-zinc-950 border-t border-zinc-800/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Price Breakdown */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase">Couple Pass</span>
              <span className="text-base font-bold text-white">₹{event.price_couples?.toLocaleString() || '6,999'}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase">Single Female</span>
              <span className="text-base font-bold text-rose-300">₹{event.price_females?.toLocaleString() || '1,999'}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-400 text-[10px] block uppercase">Single Male</span>
              <span className="text-base font-bold text-purple-300">₹{event.price_males?.toLocaleString() || '7,999'}</span>
            </div>
          </div>

          {/* Action Button */}
          {!isLoggedIn ? (
            <Link
              href="/auth?redirect=/sanctuary-pass"
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign In to Request Entry</span>
            </Link>
          ) : !hasSanctuaryPass ? (
            <button
              onClick={() => {
                onClose();
                onBuySanctuaryPass();
              }}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Acquire Sanctuary Pass</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onRequestPass();
              }}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Ticket className="w-4 h-4" />
              <span>Request Gathering Pass</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
