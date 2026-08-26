'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  AtSign,
  Heart,
  MessageSquare,
  Building2,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Star,
  Users,
  Compass,
  FileCheck,
  Ticket,
  Feather,
  Shield,
  HelpCircle,
  Zap,
  Volume2,
  MapPin
} from 'lucide-react';
import Image from 'next/image';
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
  onOpenActivation: () => void;
  onOpenIdVerification: () => void;
  onOpenStayVerification: () => void;
}

export default function KinksterLandingPage({
  isActivated,
  isIdVerified,
  isStayVerified,
  onOpenActivation,
  onOpenIdVerification,
  onOpenStayVerification
}: KinksterLandingPageProps) {
  // Real-time Spaces State from Database
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Interactive Simulator State
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
      .catch(err => console.error('Error fetching real-time spaces for Kinkster landing:', err))
      .finally(() => setLoadingSpaces(false));
  }, []);

  // Calculate dynamic simulated match score
  const calculatedMatch = Math.min(
    99,
    Math.max(72, Math.round(65 + ((shibariVal + dynamicsVal + sensoryVal + aftercareVal + jacuzziVal) / 25) * 34))
  );

  return (
    <div className="text-white selection:bg-rose-500 selection:text-white overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION: The Obsidian Circle */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-12 pb-24 overflow-hidden">
        {/* Hypnotic Glow Backgrounds */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-rose-950/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          
          {/* Glowing Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-rose-500/30 text-rose-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_25px_rgba(244,63,94,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Nothingness Lifestyle • The Obsidian Circle</span>
          </motion.div>

          {/* Seductive Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08]"
          >
            Where High Discretion <br />
            <span className="bg-gradient-to-r from-rose-400 via-purple-300 to-amber-200 bg-clip-text text-transparent italic font-serif">
              Meets Raw Chemistry.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            An invite-only, ID-vetted private social ecosystem reserved exclusively for verified guests of Nothingness. Connect under impenetrable <span className="text-rose-400 font-mono">@aliases</span>, match on deep aesthetic matrices, and unlock secret sanctuary co-stays.
          </motion.p>

          {/* Security & Exclusivity Guarantee Micro-Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-[11px] sm:text-xs text-zinc-300 font-mono"
          >
            <span className="px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Pseudonymous Handles
            </span>
            <span className="px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              Mandatory Verified Stay
            </span>
            <span className="px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Zero-Screenshot Policy
            </span>
          </motion.div>

          {/* Magnetic Primary CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={onOpenActivation}
              className="relative group px-8 py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm sm:text-base tracking-wider uppercase transition-all duration-300 shadow-[0_0_40px_rgba(225,29,72,0.5)] hover:shadow-[0_0_60px_rgba(225,29,72,0.8)] flex items-center gap-3 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
              <span>Enter The Obsidian Circle</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#vibe-simulator"
              className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-purple-400" />
              Interactive Simulator
            </a>
          </motion.div>
        </div>

        {/* Floating 3D Glass Mock Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-14 w-full max-w-3xl mx-auto"
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
                        Trusted Host
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      Delhi Sanctuaries • 4.98 ★ Discretion Score
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1">
                    🛡️ Clear Panel
                  </span>
                  <span className="px-3.5 py-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1 shadow-lg">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    98% Vibe Match
                  </span>
                </div>
              </div>

              {/* Bio & Micro Badges */}
              <p className="text-xs sm:text-sm text-zinc-300 italic mb-4 leading-relaxed font-serif">
                "Seeking deep atmospheric aesthetics, private sensory suspension in South Delhi suites, and unhurried champagne midnight conversations."
              </p>

              {/* Kink Matrix Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1">
                  <Feather className="w-3 h-3 text-rose-400" /> Shibari Aesthetics ★★★★★
                </span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1">
                  <EyeOff className="w-3 h-3 text-purple-400" /> Sensory Deprivation ★★★★☆
                </span>
                <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg flex items-center gap-1">
                  <Heart className="w-3 h-3 text-amber-400" /> Mindful Aftercare ★★★★★
                </span>
              </div>

              {/* Actions Simulator Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-900 text-xs">
                <span className="text-zinc-500 font-mono">
                  🔒 Zero-leak encrypted channel: Real names never visible.
                </span>
                <button
                  onClick={onOpenActivation}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Spice Up @velvet_aurora 🔥
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE 6 OBSIDIAN PILLARS: Feature Showcase */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono">
            Architected for Ultimate Peace of Mind
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Six Pillars of Kinkster Mode
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A revolutionary marriage of institutional-grade privacy, cutting-edge AI verification, and sensual sanctuary luxury.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pillar 1: Pseudonymity Vault */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
                <AtSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">01. The Pseudonymity Vault</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Your legal identity remains strictly encrypted in an isolated KYC vault. In Kinkster Mode, you exist purely as your chosen <span className="text-rose-300 font-mono">@alias</span> with audio voice clips. Zero real names, ever.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-rose-400/90 flex items-center gap-1">
              ✓ Encrypted Pseudonym System
            </div>
          </div>

          {/* Pillar 2: Vibe Matrix */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-purple-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">02. Mathematical Vibe Matrix</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Rate your aesthetic intensities (1 to 5 Stars) across Shibari, Power Dynamics, Sensory Deprivation, Mindful Aftercare, and Champagne Soaks. Our algorithm computes honest compatibility percentages.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-purple-400/90 flex items-center gap-1">
              ✓ 65%–99% Chemistry Scoring
            </div>
          </div>

          {/* Pillar 3: Mutual Spice Up */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">03. Mutual Spice Up 🔥 &amp; DMs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Zero unsolicited spam. In-app sandboxed chat unlocks ONLY when both members mutually "Spice Up" each other. Supports view-once disappearing photos and media reels.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
              ✓ Two-Way Consent Handshake
            </div>
          </div>

          {/* Pillar 4: Secret Soirees & Co-Stays */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">04. Secret Sanctuary Soirées</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Access invite-only masked lounge gatherings hosted exclusively by Admin-Approved Trusted Hosts. Exact discreet location coordinates are dispatched via WhatsApp 2 hours prior to RSVP confirmed guests.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-rose-400/90 flex items-center gap-1">
              ✓ South Delhi Private Lounges
            </div>
          </div>

          {/* Pillar 5: AI Health Badges */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-emerald-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">05. AI Sexual Health Badges</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Upload confidential blood panels parsed instantly by Gemini Vision AI. Displays non-stigmatizing, dignified badges (<span className="text-emerald-300">🛡️ Clear</span>, <span className="text-rose-300">🎗️ U=U</span>, <span className="text-purple-300">✨ STI Free</span>) for radical safety and honesty.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-emerald-400/90 flex items-center gap-1">
              ✓ Non-Discriminatory Health Transparency
            </div>
          </div>

          {/* Pillar 6: Previous Stay AI Proof */}
          <div className="p-7 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-blue-500/40 transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">06. Multi-Screenshot AI Stay Proof</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Instant verification via previous Airbnb, MMT, Booking.com reservation receipts or WhatsApp concierge chats. Co-guests are identified and shadow-pre-stored with zero external leaks.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-900 text-[11px] font-mono text-blue-400/90 flex items-center gap-1">
              ✓ Certified Real Guests Only
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE SIMULATOR: Real-Time Vibe Matcher */}
      {/* ------------------------------------------------------------- */}
      <section id="vibe-simulator" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono uppercase rounded-full">
              Live Interactive Widget
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Simulate Your Vibe Match %
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Adjust your preference intensities below and see how our mathematical compatibility matrix calculates chemistry with anonymous sanctuary members.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders Area (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Shibari */}
              <div className="p-3.5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-rose-400" />
                    Shibari &amp; Rope Aesthetics
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
                    Dominance &amp; Surrender Dynamics
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
                    Sensory Deprivation &amp; Blindfolds
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
                    Mindfulness &amp; Dedicated Aftercare
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
                Simulated Match Chemistry
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
                  <span className="text-[10px] text-rose-400 font-mono block">VIBE MATCH</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mb-5 font-serif italic max-w-xs">
                "High affinity detected for sensory immersion and grounded mindful aftercare in secluded South Delhi sanctuaries."
              </p>

              <button
                onClick={onOpenActivation}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Lock In Your Matrix
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. THE TWO-GATE SECURITY CRITERIA */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">
            Zero Imposters • Zero Anonymous Trolls
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Two-Gate Standard of Exclusivity
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Why Nothingness Kinkster is universally trusted by discerning lifestyle couples and solo travelers across India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Gate 1 */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold rounded-full">
                GATE 01
              </span>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Government ID Optical KYC</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every member must submit clear front &amp; back photos of their <span className="text-white font-medium">Aadhaar Card</span> or <span className="text-white font-medium">Passport</span>. Our Gemini 2.5 AI verifies 18+ age and legitimacy. Driving Licenses and Voter IDs are strictly rejected per hospitality regulations.
            </p>

            <div className="pt-3">
              {isIdVerified ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> You are ID-Verified
                </div>
              ) : (
                <button
                  onClick={onOpenIdVerification}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all"
                >
                  Verify Govt ID Now
                </button>
              )}
            </div>
          </div>

          {/* Gate 2 */}
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold rounded-full">
                GATE 02
              </span>
              <Building2 className="w-6 h-6 text-rose-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Certified Previous Stay Proof</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              To guarantee that members share our culture of luxury and respect, at least <span className="text-white font-medium">1 verified stay</span> at Nothingness is required. Auto-detected from our database, or verified via multi-screenshot AI for Airbnb, MMT, Booking.com, or WhatsApp chats.
            </p>

            <div className="pt-3">
              {isStayVerified ? (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Previous Stay Authenticated
                </div>
              ) : (
                <button
                  onClick={onOpenStayVerification}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all"
                >
                  Upload Stay Proof (Airbnb / Chat)
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SANCTUARY PLAYGROUNDS: Real-Time Active Spaces From DB    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Real-Time Sanctuary Catalog
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Sanctuaries Where Connections Happen
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Discreet, fully private suites and sanctuaries active in the Nothingness app right now.
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
                    {/* Visual Aspect Image */}
                    <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img
                        src={displayImage}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      
                      {/* Location & Price Pill */}
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
                      Explore Suite →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Fallback if no spaces in DB */}
        {!loadingSpaces && spaces.length === 0 && (
          <div className="text-center py-12 bg-zinc-950 border border-zinc-900 rounded-3xl p-8 max-w-md mx-auto">
            <Building2 className="w-10 h-10 text-rose-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">Sanctuaries Loading</h3>
            <p className="text-xs text-zinc-500 mt-1">Check back as our active suites catalog refreshes in real-time.</p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. WHISPERS OF THE SANCTUARY: Member Experiences */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-mono">
            Whispers From Inside
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Confidential Member Reflections
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "Finding people who understand Shibari aesthetics without judgement is rare in India. The fact that real names never leak gave my partner and me complete freedom."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-rose-400 font-bold">@rope_architect</span>
              <span>• Verified Couple</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "The 2-gate stay requirement is pure genius. You know everyone inside has actually stayed at Nothingness and respects the culture. The Secret Soirée was unforgettable."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-purple-400 font-bold">@midnight_onyx</span>
              <span>• Solo Traveler</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-serif italic">
              "The mutual Spice Up rule means zero unwanted DMs. And the AI blood test badges made health conversations effortless before our co-stay."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">@velvet_scarlet</span>
              <span>• Verified Guest</span>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. FINAL MAGNETIC CTA: Claim Your Handle */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-1 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 shadow-[0_0_80px_rgba(225,29,72,0.4)]">
          <div className="bg-zinc-950 rounded-[22px] p-8 sm:p-14 space-y-6">
            <div className="w-16 h-16 mx-auto bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center text-rose-400 shadow-2xl">
              <Flame className="w-8 h-8" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Claim Your <span className="text-rose-400 font-mono">@alias</span>?
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Step beyond conventional hospitality. Join an ultra-discreet sanctuary of verified connoisseurs.
            </p>

            <div className="pt-2">
              <button
                onClick={onOpenActivation}
                className="px-10 py-5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm sm:text-base tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(225,29,72,0.6)] flex items-center gap-3 mx-auto transform hover:-translate-y-1 active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>Begin 4-Step Onboarding Setup</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] font-mono text-zinc-500 pt-2">
              🔒 100% Encrypted Discretion • Real Names Are Never Exposed
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
