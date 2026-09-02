'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  AtSign,
  Heart,
  Building2,
  CheckCircle2,
  ArrowRight,
  EyeOff,
  Star,
  Compass,
  Ticket,
  Feather,
  Shield,
  MapPin,
  Check,
  CreditCard,
  Wine
} from 'lucide-react';
import Link from 'next/link';

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

export default function KinksterLandingPage({
  isActivated,
  isIdVerified,
  isStayVerified,
  entryFee: propEntryFee,
  onOpenActivation,
  onOpenIdVerification,
  onOpenStayVerification
}: KinksterLandingPageProps) {
  // Real-time Spaces State from Database
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Dynamic Entry Fee and Member Count
  const [entryFee, setEntryFee] = useState<number>(propEntryFee ?? 0);
  const [memberCount, setMemberCount] = useState<number>(54);

  // Interactive Aesthetic Chemistry Explorer State
  const [shibariVal, setShibariVal] = useState(4);
  const [dynamicsVal, setDynamicsVal] = useState(5);
  const [sensoryVal, setSensoryVal] = useState(3);
  const [aftercareVal, setAftercareVal] = useState(5);
  const [jacuzziVal, setJacuzziVal] = useState(4);

  // Fetch real-time active spaces from DB
  useEffect(() => {
    fetch('/api/spaces')
      .then(res => res.json())
      .then(data => {
        if (data.spaces && Array.isArray(data.spaces)) {
          const activeSpaces = data.spaces.filter((s: SpaceItem) => s.active !== false);
          setSpaces(activeSpaces);
        }
      })
      .catch(err => console.error('Error fetching real-time spaces:', err))
      .finally(() => setLoadingSpaces(false));
  }, []);

  // Fetch public entry fee and member stats if not supplied via props
  useEffect(() => {
    if (propEntryFee !== undefined && propEntryFee !== null) {
      setEntryFee(propEntryFee);
    } else {
      fetch('/api/kinkster/info')
        .then(res => res.json())
        .then(data => {
          if (data.entry_fee !== undefined) setEntryFee(Number(data.entry_fee));
          if (data.member_count) setMemberCount(data.member_count);
        })
        .catch(() => {});
    }
  }, [propEntryFee]);

  // Calculate dynamic simulated match score
  const calculatedMatch = Math.min(
    99,
    Math.max(72, Math.round(65 + ((shibariVal + dynamicsVal + sensoryVal + aftercareVal + jacuzziVal) / 25) * 34))
  );

  const getChemistryDescription = (score: number) => {
    if (score >= 90) {
      return "Profound resonance detected for sensory immersion, artful rope dynamics, and grounded, restorative aftercare in secluded sanctuary suites.";
    } else if (score >= 80) {
      return "Strong aesthetic alignment for unhurried evenings, power exchange, and intimate conversation by candlelight.";
    }
    return "Balanced affinity for mindful touch, private suite soaks, and thoughtful, respectful exploration.";
  };

  return (
    <div className="text-white selection:bg-rose-500 selection:text-white overflow-x-clip">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION: The Private Circle */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-10 pb-20 overflow-x-clip">
        {/* Ambient Glow Atmosphere */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-rose-950/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          
          {/* Subtle Elegance Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-rose-500/30 text-rose-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_25px_rgba(244,63,94,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Nothingness Lifestyle • The Private Circle</span>
          </motion.div>

          {/* Seductive Luxury Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]"
          >
            Where Private Desires <br />
            <span className="bg-gradient-to-r from-rose-400 via-purple-300 to-amber-200 bg-clip-text text-transparent italic font-serif">
              Find Their Sanctuary.
            </span>
          </motion.h1>

          {/* Subtitle Written for Discerning Adults */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed"
          >
            An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private monikers, discover mutual chemistry without judgment, and unlock secret sanctuary suites.
          </motion.p>

          {/* Core Trust Reassurance Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-[11px] sm:text-xs text-zinc-300 font-mono"
          >
            <span className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Confidential Monikers
            </span>
            <span className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              Verified Sanctuary Guests Only
            </span>
            <span className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              One-Time Paid Entry Barrier
            </span>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onOpenActivation}
              className="relative group px-8 py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm sm:text-base tracking-wider uppercase transition-all duration-300 shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.7)] flex items-center gap-3 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-amber-300" />
              <span>
                Enter The Circle {entryFee > 0 ? `• ₹${entryFee.toLocaleString('en-IN')}` : ''}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#membership-pass"
              className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              View Lifetime Membership
            </a>
          </motion.div>
        </div>

        {/* Seductive Sample Member Profile Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-14 w-full max-w-3xl mx-auto text-left"
        >
          <div className="p-1 rounded-3xl bg-gradient-to-b from-rose-500/30 via-purple-500/20 to-zinc-900/60 shadow-2xl backdrop-blur-2xl">
            <div className="bg-zinc-950/90 rounded-[22px] p-5 sm:p-7 border border-zinc-800/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                      alt="Sample Member"
                      className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/60 shadow-lg"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white">@velvet_aurora</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="px-2 py-0.5 bg-rose-950/70 border border-rose-500/30 text-rose-300 text-[10px] font-mono rounded">
                        Sanctuary Host
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      Delhi Sanctuaries • Discretion Rating: 4.98 ★
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1">
                    🛡️ Verified Guest
                  </span>
                  <span className="px-3.5 py-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1 shadow-lg">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    98% Chemistry
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-zinc-300 italic mb-4 leading-relaxed font-serif">
                "Seeking deep aesthetic atmosphere, Japanese rope suspension in secluded South Delhi suites, and unhurried midnight conversations over champagne."
              </p>

              {/* Aesthetic Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1.5">
                  <Feather className="w-3 h-3 text-rose-400" /> Rope &amp; Shibari
                </span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1.5">
                  <EyeOff className="w-3 h-3 text-purple-400" /> Sensory Deprivation
                </span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-amber-400" /> Mindful Aftercare
                </span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1.5">
                  <Wine className="w-3 h-3 text-rose-400" /> Late Night Soaks
                </span>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-900 text-xs">
                <span className="text-zinc-500 font-mono">
                  🔒 Absolute discretion: Real names and contacts are never displayed.
                </span>
                <button
                  onClick={onOpenActivation}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Send Spark to @velvet_aurora 🔥
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE ONE-TIME PAID ENTRY BARRIER & MEMBERSHIP PASS           */}
      {/* ------------------------------------------------------------- */}
      <section id="membership-pass" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center justify-center gap-1.5">
            <Ticket className="w-4 h-4 text-amber-400" /> Exclusivity Guaranteed
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Sovereign Circle Membership
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Why Nothingness maintains a one-time entry barrier instead of an open network.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Rationale & Philosophy (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                Zero Bots, Zero Lurkers, Zero Casual Voyeurs
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conventional social and dating apps are flooded with anonymous trolls, fake accounts, and passive spectators. Our one-time entry fee ensures that every person who enters is serious, respectful, and invested in the sanctuary culture.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Mutual Skin in the Game
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Discretion is only as strong as the people who uphold it. When every member is verified and has paid to enter, there is a collective commitment to absolute confidentiality, zero screenshots, and mutual decorum.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                No Monthly Fees, Lifetime Sovereignty
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We despise recurring subscription models. You pay once to unlock your sovereign moniker and lifetime pass. Your access remains active indefinitely as long as community discretion guidelines are respected.
              </p>
            </div>
          </div>

          {/* Pricing Showcase Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-1 rounded-3xl bg-gradient-to-br from-amber-500/40 via-rose-500/30 to-purple-600/40 shadow-2xl">
              <div className="bg-zinc-950 rounded-[22px] p-7 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-2 border-b border-zinc-800 pb-5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    Lifetime Membership Pass
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      {entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : 'Complimentary'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">/ one-time entry</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {entryFee > 0
                      ? 'Single payment barrier. Zero monthly subscriptions.'
                      : 'Complimentary access during Private Sanctuary Beta.'}
                  </p>
                </div>

                {/* What's included */}
                <div className="space-y-3 text-xs text-zinc-300">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono font-bold">
                    Everything Included in Your Pass:
                  </p>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Permanent Sovereign Private <span className="font-mono text-rose-300">@alias</span></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Access to private member media reels &amp; stories</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mutual Spark direct messaging (zero spam)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Confidential invitations to private Noir Soirées</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Priority booking for intimate suites with play rigging</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={onOpenActivation}
                  className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Claim Your Moniker &amp; Join</span>
                </button>

                <p className="text-[10px] text-zinc-500 text-center font-mono">
                  🔒 Secure checkout via PayU • Discretion guaranteed on billing statement
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. FOUR CORE FOUNDATIONS OF THE CIRCLE                        */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono">
            Designed for Dignity and Peace of Mind
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Sanctuary Standards
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A thoughtful balance of uncompromising privacy, aesthetic freedom, and authentic human connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pillar 1: Pure Pseudonymity */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all group relative overflow-hidden shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AtSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">01. Pure Anonymity &amp; Freedom</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Your legal name, phone number, and profession remain strictly isolated in our hospitality records. Within the Lifestyle Circle, you are known solely by your chosen private moniker. Express yourself without fear of social, professional, or digital compromise.
            </p>
            <div className="pt-2 text-xs font-mono text-rose-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real names are never displayed publicly</span>
            </div>
          </div>

          {/* Pillar 2: Mutual Consent & Zero Spam */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 transition-all group relative overflow-hidden shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">02. Mutual Spark Conversations</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              No unsolicited messages, awkward intrusions, or aggressive advances. Direct conversations unlock only when both members mutually send a "Spark" to each other. Messages support disappearing photos and discreet audio vibes.
            </p>
            <div className="pt-2 text-xs font-mono text-amber-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Private messaging by mutual desire only</span>
            </div>
          </div>

          {/* Pillar 3: Verified Real Guests */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-purple-500/40 transition-all group relative overflow-hidden shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">03. Verified Real Guests Only</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every member has completed at least one stay at a Nothingness sanctuary. This ensures that everyone in the circle understands the high-end hospitality environment, respects physical boundaries, and shares our appreciation for luxury.
            </p>
            <div className="pt-2 text-xs font-mono text-purple-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No outsiders or anonymous internet strangers</span>
            </div>
          </div>

          {/* Pillar 4: Secret Gatherings & Suites */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all group relative overflow-hidden shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Wine className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">04. Bespoke Play Suites &amp; Salons</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Access intimate suites equipped with discreet ceiling suspension points, custom ambient mood lighting, and oversized soaking tubs. Members also receive invitations to confidential midnight salons in secluded South Delhi residences.
            </p>
            <div className="pt-2 text-xs font-mono text-rose-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Exclusive access to private spaces &amp; soirées</span>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. AESTHETIC CHEMISTRY EXPLORER                              */}
      {/* ------------------------------------------------------------- */}
      <section id="chemistry-explorer" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono uppercase rounded-full">
              Interactive Alignment Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Explore Your Aesthetic Chemistry
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Tune your desires below to see how your sensibilities align with members across Nothingness sanctuaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders Area (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Shibari */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-rose-400" />
                    Rope Art &amp; Shibari Aesthetics
                  </span>
                  <span className="text-amber-400 font-mono">{'★'.repeat(shibariVal)}{'☆'.repeat(5 - shibariVal)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={shibariVal}
                  onChange={(e) => setShibariVal(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Power Dynamics */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    Power Exchange &amp; Surrender
                  </span>
                  <span className="text-amber-400 font-mono">{'★'.repeat(dynamicsVal)}{'☆'.repeat(5 - dynamicsVal)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={dynamicsVal}
                  onChange={(e) => setDynamicsVal(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Sensory Play */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    Sensory Immersion &amp; Blindfolds
                  </span>
                  <span className="text-amber-400 font-mono">{'★'.repeat(sensoryVal)}{'☆'.repeat(5 - sensoryVal)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sensoryVal}
                  onChange={(e) => setSensoryVal(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Aftercare */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    Mindfulness &amp; Grounded Aftercare
                  </span>
                  <span className="text-amber-400 font-mono">{'★'.repeat(aftercareVal)}{'☆'.repeat(5 - aftercareVal)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={aftercareVal}
                  onChange={(e) => setAftercareVal(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Jacuzzi Soaks */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-purple-400" />
                    Private Jacuzzi &amp; Bath Soaks
                  </span>
                  <span className="text-amber-400 font-mono">{'★'.repeat(jacuzziVal)}{'☆'.repeat(5 - jacuzziVal)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={jacuzziVal}
                  onChange={(e) => setJacuzziVal(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>
            </div>

            {/* Calculated Compatibility Gauge Result (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-center shadow-xl">
              <span className="text-[11px] font-mono uppercase text-zinc-400 mb-2">
                Sanctuary Chemistry Alignment
              </span>

              {/* Glowing Dynamic Match Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center my-3">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all duration-500"
                  style={{
                    clipPath: `polygon(50% 50%, -50% -50%, ${calculatedMatch}% -50%, ${calculatedMatch}% 150%, -50% 150%)`
                  }}
                />
                <div className="text-center">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {calculatedMatch}%
                  </span>
                  <span className="text-[10px] text-rose-400 font-mono block">MATCH VIBE</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mb-5 font-serif italic max-w-xs leading-relaxed">
                "{getChemistryDescription(calculatedMatch)}"
              </p>

              <button
                onClick={onOpenActivation}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Connect With Vetted Members
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. THE TWO CRITERIA OF TRUST                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">
            Integrity First • Pure Discretion
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Two Criteria for Admission
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Why members trust Nothingness as India's safest and most elevated lifestyle sanctuary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Criterion 1: Identity Verification */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-full">
                REQUIREMENT 01
              </span>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Private Identity Verification</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              To verify 18+ adulthood and fulfill hospitality compliance, every guest submits their <span className="text-white font-medium">Aadhaar Card</span> or <span className="text-white font-medium">Passport</span>. This information is securely archived in our private hospitality records and is <span className="text-white font-medium">never</span> visible on your social profile.
            </p>

            <div className="pt-3">
              {isIdVerified ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Identity Verified on File
                </div>
              ) : (
                <button
                  onClick={onOpenIdVerification}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Verify Govt ID in 1-Click →
                </button>
              )}
            </div>
          </div>

          {/* Criterion 2: Sanctuary Stay */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold rounded-full">
                REQUIREMENT 02
              </span>
              <Building2 className="w-6 h-6 text-rose-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Confirmed Sanctuary Stay</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Because our circle is built on mutual etiquette and appreciation for our spaces, at least <span className="text-white font-medium">one confirmed stay</span> at Nothingness is required. Automatically linked if you booked directly, or verified in 1-click via reservation confirmation from Airbnb, MMT, or Booking.com.
            </p>

            <div className="pt-3">
              {isStayVerified ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Sanctuary Stay Confirmed
                </div>
              ) : (
                <button
                  onClick={onOpenStayVerification}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Link Your Sanctuary Stay →
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. SANCTUARY SUITES: Real-Time Active Spaces From DB          */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Intimate Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Where Members Gather &amp; Stay
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Discreet, design-forward suites and residences available for private booking across Delhi.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loadingSpaces && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden p-4 space-y-4 animate-pulse">
                <div className="aspect-[4/3] bg-zinc-900 rounded-2xl" />
                <div className="h-5 bg-zinc-900 rounded w-2/3" />
                <div className="h-4 bg-zinc-900 rounded w-full" />
              </div>
            ))}
          </div>
        )}

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
                (space.images && space.images.length > 0 ? space.images[0] : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600');
              const locationStr = [space.area, space.city].filter(Boolean).join(', ') || 'New Delhi';

              return (
                <Link
                  key={space.id}
                  href={`/spaces/${space.slug}`}
                  className="group rounded-3xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-2xl hover:border-rose-500/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Image */}
                    <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img
                        src={displayImage}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      
                      {/* Location Pill */}
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

                    {/* Details Content */}
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors leading-tight">
                        {space.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {space.description || 'Private intimate sanctuary in Delhi featuring discreet luxury amenities, dedicated kink-friendly architecture, and total privacy.'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-zinc-900/60 text-xs font-mono">
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
      {/* 7. MEMBER REFLECTIONS ("WHISPERS OF THE SANCTUARY")           */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-mono">
            Whispers From Inside
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Member Reflections
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4 shadow-lg">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "Finding people who understand Shibari aesthetics without judgement is extraordinarily rare in India. The fact that real names are never shown gave my partner and me complete freedom."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-rose-400 font-bold">@rope_architect</span>
              <span>• Verified Couple</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4 shadow-lg">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "The paid entry barrier was the best decision Nothingness made. It completely keeps out the creeps and spam you see everywhere else. Everyone inside is thoughtful and respectful."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-purple-400 font-bold">@midnight_onyx</span>
              <span>• Solo Traveler</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4 shadow-lg">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "The mutual Spark rule means zero unwanted direct messages. Having genuine verified guests who have actually stayed in the suites makes all the difference."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">@velvet_scarlet</span>
              <span>• Verified Guest</span>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. FINAL MAGNETIC CTA: Claim Your Moniker                     */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-1 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 shadow-[0_0_80px_rgba(225,29,72,0.3)]">
          <div className="bg-zinc-950 rounded-[22px] p-8 sm:p-14 space-y-6">
            <div className="w-16 h-16 mx-auto bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-400 shadow-2xl">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Claim Your <span className="text-rose-400 font-mono">@alias</span>?
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Step beyond conventional hospitality. Join an ultra-discreet sanctuary of verified individuals and couples.
            </p>

            <div className="pt-2">
              <button
                onClick={onOpenActivation}
                className="px-10 py-5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm sm:text-base tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(225,29,72,0.6)] flex items-center gap-3 mx-auto transform hover:-translate-y-1 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  Activate Lifetime Access {entryFee > 0 ? `• ₹${entryFee.toLocaleString('en-IN')}` : ''}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] font-mono text-zinc-500 pt-2">
              🔒 100% Confidential Monikers • Real Names Are Never Exposed
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
