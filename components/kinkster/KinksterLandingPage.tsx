'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  AtSign,
  Building2,
  CheckCircle2,
  ArrowRight,
  EyeOff,
  Feather,
  Shield,
  MapPin,
  Check,
  Calendar,
  Clock,
  ChevronRight,
  Radio,
  Crown,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SpaceItem {
  id: string;
  title: string;
  slug: string;
  city?: string;
  area?: string;
  description?: string;
  nightly_price?: number;
  featured_image?: string;
  images?: string[];
  active?: boolean;
}

interface KinksterLandingPageProps {
  isActivated: boolean | null;
  isIdVerified: boolean;
  isStayVerified: boolean;
  entryFee?: number;
  onOpenActivation: () => void;
  onOpenIdVerification: () => void;
  onOpenStayVerification: () => void;
}

const DESIRES_LIST = [
  { id: 'shibari', name: 'Japanese Shibari Suspensions', category: 'Rope Art', tag: 'Tactile friction, aesthetic binds & structural lines' },
  { id: 'sensory', name: 'Sensory Deprivation & Soundscapes', category: 'Sensory', tag: 'Silk blindfolds, ambient vinyl & acoustic silence' },
  { id: 'sensory_bath', name: 'Candlelight Bath Soaks', category: 'Sanctuary', tag: 'Monolithic slate tub immersion & chilled champagne' },
  { id: 'power', name: 'Intentional Power Exchange', category: 'Dynamics', tag: 'Clear command, psychological safety & calm authority' },
  { id: 'masquerade', name: 'Midnight Masquerade Soirées', category: 'Gatherings', tag: 'Masked anonymity, salon dialogues & kindred spirits' },
  { id: 'aftercare', name: 'Restorative Mindful Aftercare', category: 'Mindfulness', tag: 'Weighted blankets, herbal infusions & debrief rituals' },
  { id: 'temperature', name: 'Soy Wax & Contrast Temperature', category: 'Sensation', tag: 'Low-temp candle wax, tactile ice & sensory play' },
  { id: 'brutalist', name: 'Brutalist Architectural Solitude', category: 'Sanctuary', tag: 'Raw concrete suites, high ceilings & total privacy' }
];

export default function KinksterLandingPage({
  isActivated,
  isIdVerified,
  isStayVerified,
  entryFee: propEntryFee,
  onOpenActivation,
  onOpenIdVerification,
  onOpenStayVerification
}: KinksterLandingPageProps) {
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [entryFee, setEntryFee] = useState<number>(propEntryFee ?? 1001);

  // Interactive Desire Matrix State (Demonstrating Mutual Chemistry without exposing people)
  const [selectedDesires, setSelectedDesires] = useState<Set<string>>(
    new Set(['shibari', 'sensory', 'sensory_bath', 'masquerade'])
  );

  // Fetch real-time active spaces from DB
  useEffect(() => {
    fetch('/api/spaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.spaces && Array.isArray(data.spaces)) {
          const activeSpaces = data.spaces.filter((s: SpaceItem) => s.active !== false);
          setSpaces(activeSpaces);
        }
      })
      .catch((err) => console.error('Error fetching spaces:', err))
      .finally(() => setLoadingSpaces(false));
  }, []);

  // Fetch public entry fee
  useEffect(() => {
    if (propEntryFee !== undefined && propEntryFee !== null && propEntryFee > 0) {
      setEntryFee(propEntryFee);
    } else {
      fetch('/api/kinkster/info')
        .then((res) => res.json())
        .then((data) => {
          if (data.entry_fee !== undefined) setEntryFee(Number(data.entry_fee));
        })
        .catch(() => {});
    }
  }, [propEntryFee]);

  const toggleDesire = (id: string) => {
    setSelectedDesires((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-500/30 selection:text-rose-200 overflow-x-hidden font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. CINEMATIC HERO SECTION                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 md:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-rose-950/20 via-purple-950/15 to-amber-950/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-20 right-0 w-[450px] h-[450px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-rose-500/30 text-rose-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_30px_rgba(244,63,94,0.15)] backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>The Circle • Private Monikers &amp; Desires</span>
          </motion.div>

          {/* Luxury Serif Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]"
          >
            Where Private Desires <br />
            <span className="bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 bg-clip-text text-transparent italic font-serif">
              Find Their Sanctuary.
            </span>
          </motion.h1>

          {/* Crisp, Dignified Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed font-light"
          >
            An intimate society reserved exclusively for verified guests. Connect under absolute cryptographic anonymity with private <span className="text-rose-400 font-mono font-medium">@monikers</span>, explore mutual resonance without exposure, and unlock autonomous sanctuary suites.
          </motion.p>

          {/* Core Trust Reassurance Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-zinc-300"
          >
            <span className="px-3.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Zero-Knowledge Anonymity
            </span>
            <span className="px-3.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              Dual-Blind Mutual Resonance
            </span>
            <span className="px-3.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              48-Hour Ephemeral Chambers
            </span>
          </motion.div>

          {/* Primary Action Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onOpenActivation}
              className="relative group px-8 py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-2xl text-sm sm:text-base tracking-widest uppercase transition-all duration-300 shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.7)] flex items-center gap-3 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-amber-200" />
              <span>
                Enter The Circle {entryFee > 0 ? `• ₹${entryFee.toLocaleString('en-IN')}` : ''}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#the-architecture"
              className="px-6 py-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-accent-gold" />
              The Privacy Architecture
            </a>
          </motion.div>

          {/* Editorial Photographic Hero Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="pt-10 max-w-4xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] group">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/images/circle/the-circle-noir.jpg"
                  alt="The Circle Intimate Sanctuary Experience"
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
              </div>

              {/* Bottom Editorial Caption */}
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Discreet Luxury Sanctuary • South Delhi
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                    Where Intimacy Meets Utter Discretion
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md font-light">
                    Every element designed for discerning couples and individuals who value quiet privacy above all else.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-mono text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Zero Cameras • Keyless Access</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE 4 PILLARS OF THE CIRCLE                                */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Core Platform Tenets
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Four Pillars of Sanctuary
          </h2>
          <p className="text-sm text-zinc-400">
            A private digital ecosystem built exclusively to protect your identity, facilitate intentional connection, and open physical sanctuary doors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Cryptographic Monikers */}
          <div className="p-8 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-rose-500/30 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AtSign className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Cryptographic Monikers</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Connect and post under your chosen <span className="text-white font-mono font-medium">@alias</span>. Your legal government name, phone number, and social identities are never exposed or tied to your profile. Complete freedom to express your desires without judgment.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-rose-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero-knowledge identity segregation</span>
            </div>
          </div>

          {/* Pillar 2: Dual-Blind Resonance */}
          <div className="p-8 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-amber-500/30 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Dual-Blind Mutual Resonance</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Rejection and awkwardness do not exist in The Circle. When you indicate interest in a member&apos;s desire profile, they receive <strong className="text-white">zero notification</strong> unless they also independently express mutual interest. Chemistry unlocks only when reciprocal.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-amber-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero unsolicited inbox spam</span>
            </div>
          </div>

          {/* Pillar 3: Ephemeral 48h Chambers */}
          <div className="p-8 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-purple-500/30 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">48-Hour Ephemeral Chambers</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                When mutual resonance is achieved, a private conversation chamber opens for exactly 48 hours. When the timer expires, messages, whispers, and media are completely scrubbed from server memory. Zero permanent digital breadcrumbs.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-purple-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated hard purge cron cycles</span>
            </div>
          </div>

          {/* Pillar 4: Autonomous Physical Sanctuaries */}
          <div className="p-8 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Autonomous Physical Sanctuaries</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                The Circle extends into real architecture. Reserve private brutalist suites, deep stone soaking sanctuaries, and attend ratio-balanced midnight masquerades across Delhi NCR with keyless digital access codes and certified camera bans.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>300kg rigging load-tested anchors</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONTEXTUAL EDITORIAL FEATURE: THE ART OF SENSORY INTIMACY  */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.07]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Editorial Image */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3]">
            <Image
              src="/images/circle/the-circle-tactile.jpg"
              alt="Tactile Intimacy and Knotwork Aesthetics"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block mb-1">
                Aesthetic Rituals
              </span>
              <p className="text-sm font-serif text-zinc-200 italic">
                &ldquo;True intimacy thrives where boundaries are sacred, consent is vocal, and presence is absolute.&rdquo;
              </p>
            </div>
          </div>

          {/* Editorial Narrative */}
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5 text-amber-400" /> Beyond Conventional Dating
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A Space Built on Absolute Consent &amp; High Aesthetics
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Nothingness was created because modern dating apps and social platforms are fundamentally flawed for alternate lifestyles: they expose your face, encourage entitlement, and lack vetted physical spaces.
            </p>

            <p className="text-sm text-zinc-400 leading-relaxed">
              In The Circle, every interaction is governed by the <strong className="text-zinc-200">Sanctuary Consent Protocol</strong>: verified adult identity, strict zero-tolerance harassment bans, double-tap non-verbal communication, and clear traffic light boundaries.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex-1 space-y-1">
                <span className="text-base font-bold text-white font-mono">100%</span>
                <span className="text-xs text-zinc-400 block">Pre-Vetted Legal ID Verification</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex-1 space-y-1">
                <span className="text-base font-bold text-emerald-400 font-mono">0 Logged</span>
                <span className="text-xs text-zinc-400 block">Ephemeral Messages Persisted</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. THE ARCHITECTURE OF DISCRETION (PRIVACY FIRST)             */}
      {/* ------------------------------------------------------------- */}
      <section id="the-architecture" className="py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sovereign Privacy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Architecture of Discretion
          </h2>
          <p className="text-sm text-zinc-400">
            Why members trust Nothingness with their deepest desires: hardware-level security, privacy shields, and zero digital residue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Zero-Knowledge ID Vetting</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your government ID is inspected solely to confirm 18+ legal age and human authenticity. Once vetted, raw document scans are cryptographically expunged. No database record links your ID to your @moniker.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Panic Camouflage Trigger</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Double-tapping the crest logo or shaking your phone immediately camouflages the screen into an innocuous Notion work notes document, hiding all adult feeds in 50 milliseconds.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Anti-Leak Dynamic Watermark</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every post view and chat chamber embeds a steganographic watermark invisible to the naked eye. If a bad actor attempts a screenshot, the leak is instantly traced and their access revoked permanently.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Physical RF &amp; Lens Sweeps</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All official Nothingness suites and penthouse venues undergo regular radio frequency sweeps and infrared optical lens audits. Tamper-proof camera seals are applied to all sensitive portals.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Autonomous Keyless Entry</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero front-desk judgment or intrusive check-ins. Access pins are dispatched securely to your verified session, allowing completely autonomous arrival and departure.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Crown className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">One-Time Lifetime Barrier</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              A single lifetime activation fee acts as a quality filter, completely eliminating casual lurkers, internet trolls, and fake bot accounts. A dignified community of committed adults.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. INTERACTIVE DUAL-BLIND RESONANCE SIMULATOR                */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto border-t border-white/[0.07]">
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="px-3.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono uppercase rounded-full">
              Interactive Chemistry Simulator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explore The Desire Spectrum
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Tap the desire areas that intrigue you. See how our Dual-Blind matching algorithm protects your privacy at every step.
            </p>
          </div>

          {/* Desires Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {DESIRES_LIST.map((d) => {
              const isSelected = selectedDesires.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDesire(d.id)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500/60 text-white shadow-lg shadow-rose-950/30'
                      : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold">
                        {d.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{d.name}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">{d.tag}</p>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ml-3 ${
                    isSelected ? 'bg-rose-600 border-rose-400 text-white' : 'border-zinc-700 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Simulator Visualizer */}
          <div className="p-6 rounded-2xl bg-black/80 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Privacy Guarantee
              </span>
              <h3 className="text-lg font-bold text-white font-serif">
                {selectedDesires.size > 0 ? `${selectedDesires.size} Desires Selected in Frequency Profile` : 'Select Desires Above'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                Your selections remain completely confidential. Neither members nor hosts can see what you select unless <strong className="text-white">both parties mutually resonate</strong> on the same desires.
              </p>
            </div>

            <button
              onClick={onOpenActivation}
              className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Claim Moniker &amp; Save Profile</span>
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. CONTEXTUAL EDITORIAL: MIDNIGHT MASQUERADES                 */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.07]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Editorial Narrative */}
          <div className="space-y-6 order-2 lg:order-1">
            <span className="text-xs uppercase tracking-widest text-purple-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Intimate Gatherings
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Midnight Salons &amp; Noir Masquerades
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Curated, ratio-balanced evenings held in confidential penthouses and heritage courtyards. Experience deep dialogue, dark vinyl frequencies, and masked chemistry without social baggage.
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">Tier 1: Dialogue Salons &amp; Munches</h4>
                  <span className="text-[10px] font-mono text-purple-300 font-bold">Casual Dress • Open Discussions</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Relaxed wine and tea evenings focused on consent education, shibari demonstration, and peer bonding.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">Tier 2: The Midnight Velvet Masquerade</h4>
                  <span className="text-[10px] font-mono text-amber-300 font-bold">Mandatory Masks • Strict Vetting</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Total anonymity under bespoke masks. Low ambient lighting, quiet conversation alcoves, and music.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/sanctuary-pass"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-rose-400 hover:text-white transition-colors"
              >
                <span>View Sanctuary Pass Gathering Dossiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Editorial Photograph */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] order-1 lg:order-2">
            <Image
              src="/images/circle/the-circle-masquerade.jpg"
              alt="Midnight Masquerade and Salon Anonymity"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                Sanctuary Pass Society
              </span>
              <p className="text-sm font-serif text-zinc-200 italic">
                &ldquo;Behind the mask, the performative weight of the world dissolves.&rdquo;
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. SUITES & SPACES: Real-Time Active Spaces From DB           */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto border-t border-white/[0.07]">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-14">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-rose-400 font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-rose-400" /> Dedicated Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Autonomous Suites &amp; Sanctuaries
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              High-design residential sanctuaries designed specifically for privacy, deep acoustic isolation, and alternate lifestyle comfort across Delhi NCR.
            </p>
          </div>

          <Link
            href="/spaces"
            className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Explore All Suites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Editorial Suite Feature Highlight */}
        <div className="mb-10 rounded-3xl overflow-hidden border border-white/10 relative group">
          <div className="relative aspect-[21/9] min-h-[280px] w-full">
            <Image
              src="/images/circle/the-circle-sanctuary.jpg"
              alt="Monolithic Slate Stone Soaking Bath Suite"
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Signature Sanctuary Design
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                Monolithic Soaking Baths &amp; Brutalist Acoustics
              </h3>
              <p className="text-xs text-zinc-300 max-w-lg font-light">
                Oversized stone baths, custom ceiling suspension points tested to 300kg, and total acoustic insulation for uninterrupted peace.
              </p>
            </div>
            <Link
              href="/spaces"
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white text-xs font-mono font-bold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>Explore Spaces</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dynamic Real-Time Spaces Grid */}
        {!loadingSpaces && spaces.length > 0 && (
          <div className={`grid gap-6 ${
            spaces.length === 1
              ? 'max-w-md mx-auto grid-cols-1'
              : spaces.length === 2
              ? 'max-w-3xl mx-auto grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {spaces.map((space) => {
              const displayImage =
                space.featured_image ||
                (space.images && space.images.length > 0 ? space.images[0] : '/images/circle/the-circle-sanctuary.jpg');
              const locationStr = [space.area, space.city].filter(Boolean).join(', ') || 'New Delhi';

              return (
                <Link
                  key={space.id}
                  href={`/spaces/${space.slug}`}
                  className="group rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl hover:border-rose-500/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img
                        src={displayImage}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e: any) => {
                          e.target.src = '/images/circle/the-circle-sanctuary.jpg';
                        }}
                      />
                      
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-wider text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        {locationStr}
                      </div>

                      {space.nightly_price && (
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl text-xs font-mono font-bold text-amber-300">
                          ₹{Number(space.nightly_price).toLocaleString('en-IN')}<span className="text-[10px] text-zinc-400 font-normal">/night</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors leading-tight">
                        {space.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {space.description || 'Private intimate sanctuary featuring discreet luxury amenities, dedicated kink-friendly architecture, and total privacy.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-white/[0.06] text-xs font-mono">
                    <span className="text-zinc-500">Sanctuary Suite</span>
                    <span className="text-rose-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Suite Details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. ADMISSION PATHWAY: 4 SIMPLE STEPS                          */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto border-t border-white/[0.07]">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center justify-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Clear Verification
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How to Join The Circle
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A frictionless, high-trust process designed to keep casual voyeurs out and protect legitimate guests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl font-extrabold font-mono text-rose-500/50 block">01</span>
            <h4 className="text-sm font-bold text-white">Claim Your Moniker</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create an anonymous <span className="text-white font-mono">@alias</span>. This moniker is your sole public identity across all circles and event RSVPs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl font-extrabold font-mono text-purple-500/50 block">02</span>
            <h4 className="text-sm font-bold text-white">Discreet ID Check</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verify your legal age (18+) once. After verification, raw ID data is permanently deleted from system memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl font-extrabold font-mono text-amber-500/50 block">03</span>
            <h4 className="text-sm font-bold text-white">Lifetime Activation</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pay the one-time activation barrier ({entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : '₹1,001'}). No subscriptions or recurring charges ever.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
            <span className="text-2xl font-extrabold font-mono text-emerald-500/50 block">04</span>
            <h4 className="text-sm font-bold text-white">Step into Sanctuary</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Explore the confidential feed, discover mutual desire resonance, unlock ephemeral chats, and reserve private suites.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. LIFETIME ACTIVATION CARD                                   */}
      {/* ------------------------------------------------------------- */}
      <section id="membership-pass" className="py-20 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto border-t border-white/[0.07]">
        <div className="p-1 rounded-3xl bg-gradient-to-br from-amber-500/30 via-rose-500/20 to-purple-600/30 shadow-2xl">
          <div className="bg-zinc-950 rounded-[22px] p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block mb-1">
                  Official Lifetime Membership
                </span>
                <h3 className="text-2xl font-bold text-white font-serif">The Circle Sanctuary Key</h3>
                <p className="text-xs text-zinc-400 mt-1">One fee. Permanent entry. 100% confidential.</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="text-4xl font-extrabold font-mono text-white">
                    {entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : '₹1,001'}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/ one-time</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">Lifetime Validity • Zero Recurring</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
              <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Permanent Anonymous @Alias</strong>
                  <span className="text-[11px] text-zinc-400">Your legal identity remains strictly private and protected.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Dual-Blind Mutual Resonance</strong>
                  <span className="text-[11px] text-zinc-400">Conversations unlock solely when both parties resonate.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">48-Hour Ephemeral Chambers</strong>
                  <span className="text-[11px] text-zinc-400">Chats and shared photos auto-purge with zero database trace.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Suites &amp; Masquerades Access</strong>
                  <span className="text-[11px] text-zinc-400">Priority reservations for private suites and masked salons.</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenActivation}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer"
              >
                Activate Lifetime Sanctuary Key ({entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : '₹1,001'}) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. FINAL MAGNETIC CTA: Claim Your Moniker                    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto text-center border-t border-white/[0.07]">
        <div className="p-1 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 shadow-[0_0_80px_rgba(225,29,72,0.25)]">
          <div className="bg-zinc-950 rounded-[22px] p-8 sm:p-14 space-y-6">
            <div className="w-16 h-16 mx-auto bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-400 shadow-2xl">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Claim Your <span className="text-rose-400 font-mono">@alias</span>?
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Step beyond conventional hospitality. Join an ultra-discreet sanctuary of verified individuals and couples under absolute privacy.
            </p>

            <div className="pt-2">
              <button
                onClick={onOpenActivation}
                className="px-10 py-5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-2xl text-sm sm:text-base tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(225,29,72,0.6)] flex items-center gap-3 mx-auto transform hover:-translate-y-1 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  Activate Lifetime Access {entryFee > 0 ? `• ₹${entryFee.toLocaleString('en-IN')}` : ''}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] font-mono text-zinc-500 pt-2">
              🔒 100% Confidential Monikers • Real Legal Identity Is Never Exposed
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
