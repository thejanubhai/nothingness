'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Ticket, 
  ArrowRight, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import SanctuaryPassBuyModal from '@/components/events/SanctuaryPassBuyModal';
import EventConciergeModal from '@/components/events/EventConciergeModal';
import EventDossierModal from '@/components/events/EventDossierModal';
import LiveTicketQRModal from '@/components/events/LiveTicketQRModal';
import IDUploadModal from '@/components/IDUploadModal';

interface SanctuaryEvent {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tier: 'munch' | 'rave' | 'soiree';
  event_date: string;
  end_time?: string;
  dress_code: string;
  consent_marshall_name: string;
  price_couples: number;
  price_females: number;
  price_males: number;
  price_nonbinary: number;
  max_couples: number;
  max_females: number;
  max_males: number;
  max_nonbinary: number;
  secret_location_address?: string;
  secret_location_coordinates?: string;
  secret_location_instructions?: string;
  location_revealed_hours_before?: number;
  spaces?: {
    title: string;
    city: string;
    images?: string[];
  };
}

interface EventApplication {
  id: string;
  event_id: string;
  category: string;
  status: string;
  ai_trust_score: number;
  payment_deadline?: string;
  qr_secret_token: string;
}

function SanctuaryPassContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [hasSanctuaryPass, setHasSanctuaryPass] = useState(false);
  const [passPrice, setPassPrice] = useState(1499);
  const [userAlias, setUserAlias] = useState('Guest');
  
  const [events, setEvents] = useState<SanctuaryEvent[]>([]);
  const [applications, setApplications] = useState<Record<string, EventApplication>>({});
  const [selectedTier, setSelectedTier] = useState<'all' | 'munch' | 'rave' | 'soiree'>('all');

  // Modals
  const [showBuyPassModal, setShowBuyPassModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [selectedEventForConcierge, setSelectedEventForConcierge] = useState<SanctuaryEvent | null>(null);
  const [selectedEventForDossier, setSelectedEventForDossier] = useState<SanctuaryEvent | null>(null);
  const [selectedEventForTicket, setSelectedEventForTicket] = useState<{ event: SanctuaryEvent; app: EventApplication } | null>(null);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sanctuary-pass/portal-data');
      const data = await res.json();

      setIsLoggedIn(!!data.isLoggedIn);
      setIsIdVerified(data.isIdVerified || false);
      setHasSanctuaryPass(data.hasSanctuaryPass || false);
      setPassPrice(data.passPrice || 1499);
      setUserAlias(data.userAlias || 'Guest');
      setEvents(data.events || []);

      const appsMap: Record<string, EventApplication> = {};
      (data.applications || []).forEach((app: EventApplication) => {
        appsMap[app.event_id] = app;
      });
      setApplications(appsMap);
    } catch (err) {
      console.error('Failed to load Sanctuary Pass portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const passPurchased = searchParams?.get('pass_purchased');
    const ticketConfirmed = searchParams?.get('ticket_confirmed');

    if (passPurchased === 'true') {
      toast.success('Sanctuary Pass Activated!', {
        description: 'You now hold lifetime access to all Nothingness secret gatherings.',
      });
    } else if (ticketConfirmed === 'true') {
      toast.success('Gathering Pass Confirmed!', {
        description: 'Your dynamic entry QR code and coordinates are now active.',
      });
    }

    fetchPortalData();
  }, [searchParams]);

  const handlePayTicket = async (event: SanctuaryEvent, app: EventApplication) => {
    try {
      const res = await fetch(`/api/events/${event.id}/order`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate ticket payment.');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;

      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value || '');
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      toast.error('Payment Error', { description: err.message });
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedTier === 'all') return true;
    return e.tier === selectedTier;
  });

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Lockscreen Push Subscription Banner */}
      {isLoggedIn && <PushNotificationPrompt />}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-mono mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Curated Lifestyle Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 bg-clip-text text-transparent">
            Nothingness Sanctuary Pass
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Invite-only salons, masquerade raves, and private soirées hosted across official Nothingness Sanctuaries.
          </p>
        </div>

        {isLoggedIn && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              @{userAlias}
            </span>
            {hasSanctuaryPass ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Passholder Active
              </span>
            ) : (
              <button
                onClick={() => {
                  if (!isIdVerified) setShowIdModal(true);
                  else setShowBuyPassModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Acquire Pass (₹{passPrice.toLocaleString()})
              </button>
            )}
          </div>
        )}
      </div>

      {/* GATE 1 & 2: UNACTIVATED USER SHOWCASE */}
      {!hasSanctuaryPass && !loading && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/30 border border-amber-500/30 p-6 sm:p-10 shadow-2xl mb-12">
          <div className="max-w-2xl space-y-5 relative z-10">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono uppercase tracking-widest">
              Exclusive Members Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-bold leading-tight">
              Unlock the <span className="text-amber-400">Secret Gatherings</span> Vault
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Every Nothingness gathering is strictly capped, balanced, and protected by strict camera bans and discrete on-ground marshalls. 
              Acquire your 1-time Lifetime Sanctuary Pass to consult with our Concierge and request confidential gathering passes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isLoggedIn ? (
                <Link
                  href="/auth?redirect=/sanctuary-pass"
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all"
                >
                  Sign In with OTP to Begin →
                </Link>
              ) : !isIdVerified ? (
                <button
                  onClick={() => setShowIdModal(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Identity Privately (Step 1) →</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowBuyPassModal(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Acquire Lifetime Sanctuary Pass (₹{passPrice.toLocaleString()}) →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GATHERINGS DIRECTORY */}
      <div className="space-y-6">
        {/* The 2-Level Vetting & Munches Architecture */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/90 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              The Vetting Progression
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Sanctuary Pass Required for Level 1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <span className="text-white font-bold">Level 1: Munches &amp; Salons</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                ID verification &amp; Sanctuary Pass unlocks Tier 1 Munches. Relaxed conversational meetups where phones ARE allowed. A Nothingness representative is present to discreetly observe vibe and mutual etiquette.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">2</span>
                <span className="text-white font-bold">Level 2: Masquerades &amp; Soirées</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                In-person Munch vetting unlocks higher tiers confidentially. Phones are stored safely outside the premises before entry—because every attendee is already physically vetted, there is zero suspicion or anxiety.
              </p>
            </div>
          </div>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-900 pb-4">
          {[
            { id: 'all', label: 'All Gatherings' },
            { id: 'munch', label: 'Tier 1: Salons & Munches' },
            { id: 'rave', label: 'Tier 2: Noir Masquerades' },
            { id: 'soiree', label: 'Tier 3: Intimate Soirées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTier === tab.id
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg'
                  : 'bg-zinc-900/70 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="text-center py-24 font-mono text-xs text-zinc-500 animate-pulse">
            Loading Sanctuary Gatherings...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
            <Sparkles className="w-10 h-10 text-amber-400/50 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Gatherings in this Tier</h3>
            <p className="text-xs text-zinc-500 mt-1">Check back soon for newly published sanctuary dates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((evt) => {
              const app = applications[evt.id];
              const eventDateStr = new Date(evt.event_date).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={evt.id}
                  className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Visual Space Image Preview if available */}
                  {evt.spaces?.images?.[0] && (
                    <div className="relative h-44 -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-4 overflow-hidden rounded-t-3xl">
                      <img
                        src={evt.spaces.images[0]}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                      <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{evt.spaces.title} • {evt.spaces.city || 'South Delhi'}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Tier and Date Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        {evt.tier === 'munch' ? 'Tier 1 • Salon & Munch' : evt.tier === 'rave' ? 'Tier 2 • Noir Masquerade' : 'Tier 3 • Intimate Soirée'}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        {eventDateStr}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                      {evt.tagline && <p className="text-xs text-amber-400/80 font-mono mt-0.5">{evt.tagline}</p>}
                      <p className="text-xs text-zinc-300 leading-relaxed mt-2.5 line-clamp-3">{evt.description}</p>
                    </div>

                    {/* Meta Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
                      <div className="text-zinc-400">
                        Dress Code: <span className="text-white font-bold">{evt.dress_code || 'Noir Luxury'}</span>
                      </div>
                      <div className="text-zinc-400">
                        Floor Lead: <span className="text-purple-300 font-bold">{evt.consent_marshall_name || 'Aria'}</span>
                      </div>
                    </div>

                    {/* Tiered Prices */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                      <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
                        Couple: <strong className="text-white">₹{evt.price_couples?.toLocaleString()}</strong>
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
                        Female: <strong className="text-white">₹{evt.price_females?.toLocaleString()}</strong>
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
                        Male: <strong className="text-white">₹{evt.price_males?.toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Action Area */}
                  <div className="pt-6 mt-4 border-t border-zinc-900 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForDossier(evt)}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Gathering Dossier &amp; Lookbook →</span>
                    </button>

                    {!isLoggedIn ? (
                      <Link
                        href="/auth?redirect=/sanctuary-pass"
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Sign In with OTP to Request Pass →</span>
                      </Link>
                    ) : !hasSanctuaryPass ? (
                      <button
                        onClick={() => {
                          if (!isIdVerified) setShowIdModal(true);
                          else setShowBuyPassModal(true);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Acquire Sanctuary Pass to Enter</span>
                      </button>
                    ) : !app ? (
                      <button
                        onClick={() => setSelectedEventForConcierge(evt)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Request Discretion Pass (Concierge)</span>
                      </button>
                    ) : app.status === 'confirmed' ? (
                      <button
                        onClick={() => setSelectedEventForTicket({ event: evt, app })}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>View Live Dynamic QR &amp; Coordinates</span>
                      </button>
                    ) : app.status === 'approved_payment_pending' ? (
                      <button
                        onClick={() => handlePayTicket(evt, app)}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Pass Approved • Complete Checkout</span>
                      </button>
                    ) : app.status === 'waitlisted' ? (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-zinc-300">Balancing Waitlist (Score: {app.ai_trust_score}/100)</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">Push Alerts On</span>
                      </div>
                    ) : app.status === 'dropped_out' ? (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                        Slot Released &amp; Transferred
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
                        Application Status: {app.status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      <SanctuaryPassBuyModal
        isOpen={showBuyPassModal}
        onClose={() => setShowBuyPassModal(false)}
        passPrice={passPrice}
        onSuccess={fetchPortalData}
      />

      <EventConciergeModal
        isOpen={!!selectedEventForConcierge}
        onClose={() => setSelectedEventForConcierge(null)}
        event={selectedEventForConcierge}
        onApplicationSubmitted={() => {
          setSelectedEventForConcierge(null);
          fetchPortalData();
        }}
      />

      <LiveTicketQRModal
        isOpen={!!selectedEventForTicket}
        onClose={() => setSelectedEventForTicket(null)}
        event={selectedEventForTicket?.event || null}
        application={selectedEventForTicket?.app || null}
        userAlias={userAlias}
        onDropOutSuccess={fetchPortalData}
      />

      <EventDossierModal
        isOpen={!!selectedEventForDossier}
        onClose={() => setSelectedEventForDossier(null)}
        event={selectedEventForDossier}
        isLoggedIn={isLoggedIn}
        hasSanctuaryPass={hasSanctuaryPass}
        onRequestPass={() => {
          const target = selectedEventForDossier;
          setSelectedEventForDossier(null);
          if (!isIdVerified) setShowIdModal(true);
          else if (target) setSelectedEventForConcierge(target);
        }}
        onBuySanctuaryPass={() => {
          setSelectedEventForDossier(null);
          if (!isIdVerified) setShowIdModal(true);
          else setShowBuyPassModal(true);
        }}
      />

      <IDUploadModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        onSuccess={() => {
          setShowIdModal(false);
          setIsIdVerified(true);
          fetchPortalData();
          setShowBuyPassModal(true);
        }}
      />
    </div>
  );
}

export default function SanctuaryPassPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white pt-32 text-center text-xs font-mono text-white/40">Loading Sanctuary Pass...</div>}>
      <SanctuaryPassContent />
    </Suspense>
  );
}
