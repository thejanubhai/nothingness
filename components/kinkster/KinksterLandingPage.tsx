'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  EyeOff,
  Star,
  Compass,
  Ticket,
  Feather,
  Shield,
  MapPin,
  Check,
  CreditCard,
  Wine,
  Users,
  Calendar,
  Clock,
  Play,
  Pause,
  Volume2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Share2,
  Radio,
  Zap,
  Coffee,
  Crown
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

interface Persona {
  id: string;
  alias: string;
  category: string;
  location: string;
  avatarUrl: string;
  discretionRating: string;
  chemistryScore: number;
  bio: string;
  tags: { name: string; stars: number }[];
  audioTitle: string;
  eventAttending?: string;
  stayProof: string;
}

const VAULT_PERSONAS: Persona[] = [
  {
    id: 'velvet_nocturne',
    alias: 'velvet_nocturne',
    category: 'Dynamic Switch',
    location: 'South Delhi (GK / Hauz Khas)',
    avatarUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=400',
    discretionRating: '5.0 ★ (8 Stays)',
    chemistryScore: 98,
    bio: 'Casual candid phone-shot vibe. Drawn to the quiet tension of Japanese Shibari before release. Love booking The Void suite for long unhurried weekend evenings and ambient vinyl soaks.',
    tags: [
      { name: 'Rope & Shibari', stars: 5 },
      { name: 'Sensory Deprivation', stars: 4 },
      { name: 'Switch Dynamic', stars: 5 }
    ],
    audioTitle: 'Sensory Note • "The beauty of quiet tension..." (8s)',
    eventAttending: 'The Velvet Masquerade (Saturday)',
    stayProof: 'Verified Guest • The Void Suite'
  },
  {
    id: 'obsidian_silk_duo',
    alias: 'obsidian_silk_duo',
    category: 'Lifestyle Couple',
    location: 'Gurgaon (Golf Course Rd) & South Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1609137144827-c10427843444?auto=format&fit=crop&q=80&w=400',
    discretionRating: '4.98 ★ (14 Stays)',
    chemistryScore: 96,
    bio: 'Aesthetic lifestyle couple. We host private wine evenings, attend Munches, and appreciate absolute consent. Looking for vetted couples or solo switches to spontaneously co-book private suites.',
    tags: [
      { name: 'Couples Dynamic', stars: 5 },
      { name: 'Sensory Baths', stars: 5 },
      { name: 'Noir Masquerades', stars: 5 }
    ],
    audioTitle: 'Sensory Note • "Discretion is our standard..." (11s)',
    eventAttending: 'Sanctuary Munch & Discussion (Thursday)',
    stayProof: 'Verified Guest • The Penthouse Suite'
  },
  {
    id: 'aria_shibari',
    alias: 'aria_shibari',
    category: 'Sensory Rigger',
    location: 'South Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400',
    discretionRating: '5.0 ★ (6 Stays)',
    chemistryScore: 94,
    bio: 'Tactile floor ties, suspension lines, and restorative grounding aftercare. Aesthetic phone snapshots, zero fake pretension, pure presence.',
    tags: [
      { name: 'Japanese Floor Rope', stars: 5 },
      { name: 'Anatomical Safety', stars: 5 },
      { name: 'Mindful Aftercare', stars: 5 }
    ],
    audioTitle: 'Sensory Note • "Breathwork and release..." (9s)',
    eventAttending: 'Rope & Reverie Munch (Thursday)',
    stayProof: 'Verified Guest • The Brutalist Void'
  },
  {
    id: 'kinkster_architect',
    alias: 'kinkster_architect',
    category: 'Sovereign Dominant',
    location: 'Delhi NCR',
    avatarUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
    discretionRating: '5.0 ★ (11 Stays)',
    chemistryScore: 92,
    bio: 'Architect fascinated by structured restraint, brutalist geometry, and sensory isolation. The architecture of a room dictates the intensity of connection.',
    tags: [
      { name: 'Intentional Dominance', stars: 5 },
      { name: 'Brutalist Suites', stars: 5 },
      { name: 'Heavy 300kg Rigging', stars: 5 }
    ],
    audioTitle: 'Sensory Note • "Atmosphere dictates desire..." (7s)',
    eventAttending: 'Sanctuary Munch & Dialogue (Thursday)',
    stayProof: 'Verified Guest • South Delhi Sanctuary'
  },
  {
    id: 'aurora_sub',
    alias: 'aurora_sub',
    category: 'Consensual Surrender',
    location: 'New Delhi',
    avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400',
    discretionRating: '5.0 ★ (5 Stays)',
    chemistryScore: 90,
    bio: 'Seeking slow psychological power exchange, candlelit ambient silence, and deep emotional grounding in secluded private suites.',
    tags: [
      { name: 'Consensual Surrender', stars: 5 },
      { name: 'Mindfulness & Tea', stars: 5 },
      { name: 'Silk Blindfolds', stars: 4 }
    ],
    audioTitle: 'Sensory Note • "In stillness and trust..." (10s)',
    eventAttending: 'Sanctuary Munch & Dialogue (Thursday)',
    stayProof: 'Verified Guest • The Void Sanctuary'
  },
  {
    id: 'nocturnal_switch',
    alias: 'nocturnal_switch',
    category: 'Sensory Explorer',
    location: 'South Delhi & Bangalore',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    discretionRating: '4.9 ★ (7 Stays)',
    chemistryScore: 89,
    bio: 'Sound designer exploring sensory deprivation, dark ambient frequencies, and quiet midnight conversations over champagne.',
    tags: [
      { name: 'Dark Vinyl Frequencies', stars: 5 },
      { name: 'Sensory Deprivation', stars: 5 },
      { name: 'Switch Polarity', stars: 4 }
    ],
    audioTitle: 'Sensory Note • "Vinyl and darkness..." (8s)',
    eventAttending: 'The Velvet Masquerade (Saturday)',
    stayProof: 'Verified Guest • The Void Suite'
  }
];

const DESIRES_LIST = [
  { id: 'shibari', name: 'Japanese Shibari Suspensions', category: 'Rope Art', tag: 'Tactile friction & artistic binds' },
  { id: 'sensory', name: 'Sensory Deprivation & Sound', category: 'Sensory', tag: 'Silk blindfolds & acoustic silence' },
  { id: 'sensory_bath', name: 'Candlelight Bath Soaks', category: 'Sensory Vibe', tag: 'Warm water immersion & champagne' },
  { id: 'power', name: 'Intentional Power Exchange', category: 'Dynamics', tag: 'Clear command & calm authority' },
  { id: 'masquerade', name: 'Midnight Masquerade Soirées', category: 'Gatherings', tag: 'Masked anonymity & kindred spirits' },
  { id: 'aftercare', name: 'Restorative Mindful Aftercare', category: 'Mindfulness', tag: 'Herbal tea, weighted blankets & debrief' },
  { id: 'temperature', name: 'Soy Candle Wax & Temperature', category: 'Sensation', tag: 'Low-temp wax & contrast touch' },
  { id: 'brutalist', name: 'Brutalist Architectural Isolation', category: 'Sanctuary', tag: 'Raw concrete & heavy ceiling points' },
  { id: 'leather', name: 'Supple Leather Restraints', category: 'Bondage', tag: 'Aesthetic discipline & butter-soft cuffs' },
  { id: 'breathwork', name: 'Somatic Breathwork & Release', category: 'Somatic', tag: 'Paced breathing & intense focus' },
  { id: 'roleplay', name: 'Scripted Psychological Fantasy', category: 'Roleplay', tag: 'Power inversion without judgment' },
  { id: 'voyeurism', name: 'Masked Mystique & Mutual Gazing', category: 'Aesthetic', tag: 'Being seen under mask in candlelit alcoves' }
];

const SANCTUARY_WHISPERS = [
  {
    id: 'w1',
    confessionId: 'Whisper #104',
    moniker: '@velvet_nocturne',
    category: 'Dynamic Switch',
    duration: '12s',
    quote: 'The brutalist suite in South Delhi made me feel safer to surrender than anywhere in my life. Knowing there are zero cameras allowed my mind to truly let go.',
    audioTitle: 'On Surrender & Acoustic Silence'
  },
  {
    id: 'w2',
    confessionId: 'Whisper #087',
    moniker: '@obsidian_silk_duo',
    category: 'Lifestyle Couple',
    duration: '15s',
    quote: 'We attended the masked soirée last month. Meeting people who understand lifestyle culture without creepy entitlement is so rare in India. It rekindled our spark.',
    audioTitle: 'Couples Reflection on Noir Soirées'
  },
  {
    id: 'w3',
    confessionId: 'Whisper #112',
    moniker: '@aria_shibari',
    category: 'Rigger & Healer',
    duration: '9s',
    quote: 'First time doing floor rope in The Void. The concrete acoustics, the warm aftercare tea, the deep somatic release—pure poetry.',
    audioTitle: 'Tactile Shibari & Grounding'
  },
  {
    id: 'w4',
    confessionId: 'Whisper #063',
    moniker: '@kinkster_architect',
    category: 'Dominant',
    duration: '11s',
    quote: 'The paid entry barrier keeps the noise out. Inside, everyone is respectful, educated, and intentional about their boundaries.',
    audioTitle: 'Why the Paid Barrier Protects Us'
  }
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
  // Real-time Spaces State from Database
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Dynamic Entry Fee and Member Count
  const [entryFee, setEntryFee] = useState<number>(propEntryFee ?? 0);
  const [memberCount, setMemberCount] = useState<number>(64);

  // Persona Vault State
  const [activePersonaIdx, setActivePersonaIdx] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Interactive Desire Matrix State
  const [desireSelections, setDesireSelections] = useState<Record<string, 'must' | 'curious' | 'pass'>>({
    shibari: 'must',
    sensory: 'must',
    sensory_bath: 'must',
    masquerade: 'curious',
    aftercare: 'must'
  });

  // Sanctuary Whispers Audio Player State
  const [activeWhisperIdx, setActiveWhisperIdx] = useState<number>(0);
  const [isPlayingWhisper, setIsPlayingWhisper] = useState<boolean>(false);

  // Quiz State (The Aesthetic Blueprint)
  const [quizStep, setQuizStep] = useState<number>(1);
  const [quizAnswers, setQuizAnswers] = useState<{ polarity?: string; vibe?: string; element?: string }>({});
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

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

  const activePersona = VAULT_PERSONAS[activePersonaIdx];
  const activeWhisper = SANCTUARY_WHISPERS[activeWhisperIdx];

  const handleNextPersona = () => {
    setIsPlayingAudio(false);
    setActivePersonaIdx((prev) => (prev + 1) % VAULT_PERSONAS.length);
  };

  const handlePrevPersona = () => {
    setIsPlayingAudio(false);
    setActivePersonaIdx((prev) => (prev - 1 + VAULT_PERSONAS.length) % VAULT_PERSONAS.length);
  };

  const toggleDesire = (id: string) => {
    setDesireSelections(prev => {
      const current = prev[id];
      if (!current) return { ...prev, [id]: 'must' };
      if (current === 'must') return { ...prev, [id]: 'curious' };
      if (current === 'curious') return { ...prev, [id]: 'pass' };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const mustCount = Object.values(desireSelections).filter(v => v === 'must').length;
  const curiousCount = Object.values(desireSelections).filter(v => v === 'curious').length;

  // Quiz Results Logic
  const getArchetypeResult = () => {
    const { polarity } = quizAnswers;
    if (polarity === 'dominant') {
      return {
        title: 'The Sovereign Architect',
        tagline: 'Precision, Structural Restraint & Intentional Space',
        matchPercent: 97,
        membersCount: 19,
        recommendedEvent: 'The Velvet Masquerade (Saturday)',
        recommendedSuite: 'The Brutalist Void (South Delhi)',
        desc: 'You thrive when holding container space with clarity and calm authority. You value architectural brutality, deliberate tension, and uncompromising safety protocols.'
      };
    }
    if (polarity === 'surrender') {
      return {
        title: 'The Nocturnal Sensorialist',
        tagline: 'Consensual Release, Sensory Immersion & Grounded Trust',
        matchPercent: 95,
        membersCount: 24,
        recommendedEvent: 'Rope & Reverie Salon (Thursday)',
        recommendedSuite: 'The Obsidian Soaking Suite',
        desc: 'You experience profound liberation by letting go of control within an impeccably safe, vetted sanctuary. Scent, candlelight, and patient aftercare are your sanctum.'
      };
    }
    if (polarity === 'couple') {
      return {
        title: 'The Obsidian Connoisseurs',
        tagline: 'Curated Chemistry, Fine Wine & Masked Soirées',
        matchPercent: 98,
        membersCount: 14,
        recommendedEvent: 'The Obsidian Soirée (Fortnight)',
        recommendedSuite: 'The Penthouse Sanctuary Suite',
        desc: 'You and your partner navigate lifestyle culture with mutual elegance and uncompromising discretion. You seek peer couples who share aesthetic taste without awkward drama.'
      };
    }
    return {
      title: 'The Velvet Switch',
      tagline: 'Fluid Polarity, Japanese Rope & Atmospheric Play',
      matchPercent: 96,
      membersCount: 22,
      recommendedEvent: 'The Velvet Masquerade (Saturday)',
      recommendedSuite: 'The Brutalist Void Sanctuary',
      desc: 'You move seamlessly between commanding presence and surrendered vulnerability. You appreciate tactile rope friction, high discretion, and unhurried champagne nights.'
    };
  };

  return (
    <div className="text-white selection:bg-rose-500 selection:text-white overflow-x-clip">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION: The Private Circle                           */}
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
            <span>Nothingness Lifestyle • The Sovereign Circle</span>
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
            An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private monikers, discover mutual chemistry without judgment, and unlock secret sanctuary suites and midnight soirées.
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
              One-Time Entry Barrier
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
              href="#vault-explorer"
              className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              Browse Member Vault ({memberCount}+ Members)
            </a>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE VAULT: BROWSE ANONYMOUS MEMBER PERSONAS (ADDICTIVE)    */}
      {/* ------------------------------------------------------------- */}
      <section id="vault-explorer" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> The Sovereign Vault
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Meet Vetted Lifestyle Members
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real individuals and couples who have walked our halls. Browse personas under total anonymity.
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {VAULT_PERSONAS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setIsPlayingAudio(false);
                setActivePersonaIdx(idx);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                activePersonaIdx === idx
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 border border-rose-400'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
              }`}
            >
              <span>@{p.alias}</span>
              <span className="text-[10px] opacity-70">({p.category})</span>
            </button>
          ))}
        </div>

        {/* Active Persona Showcase Card */}
        <div className="p-1 rounded-3xl bg-gradient-to-b from-rose-500/30 via-purple-500/20 to-zinc-900/60 shadow-2xl backdrop-blur-2xl">
          <div className="bg-zinc-950/95 rounded-[22px] p-6 sm:p-8 border border-zinc-800/80">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6 mb-6">
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={activePersona.avatarUrl}
                    alt={activePersona.alias}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-rose-500/60 shadow-xl"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-lg sm:text-xl font-extrabold text-white">
                      @{activePersona.alias}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="px-2.5 py-0.5 bg-rose-950/70 border border-rose-500/30 text-rose-300 text-[11px] font-mono rounded-md">
                      {activePersona.category}
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-400 mt-1 font-mono flex items-center gap-2">
                    <span>{activePersona.location}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{activePersona.discretionRating}</span>
                  </p>
                  
                  <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activePersona.stayProof}</span>
                  </p>
                </div>
              </div>

              {/* Chemistry & Event Attending Badges */}
              <div className="flex flex-col sm:flex-row items-start md:items-end gap-2.5">
                {activePersona.eventAttending && (
                  <div className="px-3 py-1.5 bg-purple-950/50 border border-purple-500/30 rounded-xl text-[11px] font-mono text-purple-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>{activePersona.eventAttending}</span>
                  </div>
                )}
                <span className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  {activePersona.chemistryScore}% Chemistry Vibe
                </span>
              </div>

            </div>

            {/* Persona Bio */}
            <p className="text-sm sm:text-base text-zinc-200 italic mb-6 leading-relaxed font-serif">
              "{activePersona.bio}"
            </p>

            {/* Kink Desires with Star Ratings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {activePersona.tags.map((tag, i) => (
                <div key={i} className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{tag.name}</span>
                  <span className="text-amber-400 text-xs font-mono">
                    {'★'.repeat(tag.stars)}{'☆'.repeat(5 - tag.stars)}
                  </span>
                </div>
              ))}
            </div>

            {/* Audio Vibe Note Player Preview */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">{activePersona.audioTitle}</span>
                  <span className="text-[10px] text-zinc-400">Recorded inside Nothingness Sanctuary Suite</span>
                </div>
              </div>

              {/* Animated Waveform */}
              <div className="flex items-center gap-1 h-5 px-2">
                {[0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.9, 0.3, 0.8, 0.4].map((scale, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-rose-400 transition-all duration-300 ${
                      isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                    }`}
                    style={{
                      height: isPlayingAudio ? `${Math.max(6, scale * 20)}px` : '5px',
                      animationDelay: `${i * 90}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900">
              
              {/* Pagination Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPersona}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer"
                  title="Previous Persona"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-zinc-500 px-2">
                  {activePersonaIdx + 1} of {VAULT_PERSONAS.length}
                </span>
                <button
                  onClick={handleNextPersona}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer"
                  title="Next Persona"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={onOpenActivation}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Send Spark to @{activePersona.alias}</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE DESIRE MATRIX & CHEMISTRY RADAR (GAME LOOP)    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono uppercase rounded-full">
              Interactive Alignment Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              The Desire Matrix &amp; Chemistry Radar
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Tap any desire to toggle your curiosity level. Watch how your frequency resonates with real sanctuary members in Delhi.
            </p>
          </div>

          {/* Desires Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {DESIRES_LIST.map((d) => {
              const status = desireSelections[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDesire(d.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    status === 'must'
                      ? 'bg-rose-950/50 border-rose-500/60 shadow-lg shadow-rose-950/40 text-white'
                      : status === 'curious'
                      ? 'bg-purple-950/40 border-purple-500/40 text-zinc-200'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300/80 font-bold">
                      {d.category}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      {status === 'must' ? '🔥 Must Try' : status === 'curious' ? '✨ Curious' : '➕ Tap to Add'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{d.name}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">{d.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Calculated Chemistry Output */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Resonance Blueprint Calculated
              </span>
              <h3 className="text-lg font-bold text-white font-serif">
                {mustCount >= 3 ? 'Deep Affinity: Sensory & Structural Immersion' : 'Curated Exploratory Frequency'}
              </h3>
              <p className="text-xs text-zinc-400">
                You marked <span className="text-rose-400 font-bold">{mustCount} Musts</span> and <span className="text-purple-400 font-bold">{curiousCount} Curious Desires</span>. Matches 18+ members in Delhi NCR.
              </p>
            </div>

            <button
              onClick={onOpenActivation}
              className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Connect with Shared Desires</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. INTERACTIVE QUIZ: THE AESTHETIC BLUEPRINT (HIGH HOOK)     */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="p-1 rounded-3xl bg-gradient-to-br from-purple-500/20 via-rose-500/20 to-amber-500/20 shadow-2xl">
          <div className="bg-zinc-950 rounded-[22px] p-6 sm:p-10 space-y-6">
            
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono uppercase rounded-full">
                Self-Discovery Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Find Your Aesthetic Blueprint
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Answer 3 intuitive questions to calculate your lifestyle archetype and discover matching members in Delhi NCR.
              </p>
            </div>

            {!quizCompleted ? (
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 border-b border-zinc-800 pb-3">
                  <span>Question {quizStep} of 3</span>
                  <span className="text-rose-400">{quizStep === 1 ? 'Energetic Polarity' : quizStep === 2 ? 'Sanctuary Space' : 'Core Element'}</span>
                </div>

                {quizStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-base font-bold text-white">1. What is your primary energetic frequency?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'dominant', title: 'The Sovereign Dominant', desc: 'Precision, intentional restraint, holding grounded space.' },
                        { id: 'surrender', title: 'The Consensual Surrender', desc: 'Letting go of control, sensory immersion, deep release.' },
                        { id: 'switch', title: 'The Dynamic Switch', desc: 'Fluid polarity, exploring both ends of tension and surrender.' },
                        { id: 'couple', title: 'The Lifestyle Couple', desc: 'Curated chemistry, fine wine, and masked soirée explorations.' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setQuizAnswers({ ...quizAnswers, polarity: opt.id });
                            setQuizStep(2);
                          }}
                          className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-rose-500/50 text-left transition-all cursor-pointer group"
                        >
                          <span className="text-xs font-bold text-white group-hover:text-rose-400 block">{opt.title}</span>
                          <span className="text-[11px] text-zinc-400 mt-1 block">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-base font-bold text-white">2. Your ideal sanctuary retreat setting?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'void', title: 'The Brutalist Void', desc: 'Raw concrete, ceiling suspension points, absolute acoustic isolation.' },
                        { id: 'sensory_bath', title: 'The Obsidian Soaking Suite', desc: 'Warm candlelight, oversized soaking bath, plush silk robes.' },
                        { id: 'masquerade', title: 'Midnight Soirée Penthouse', desc: 'Dark ambient vinyl, masked anonymity, secluded conversation alcoves.' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setQuizAnswers({ ...quizAnswers, vibe: opt.id });
                            setQuizStep(3);
                          }}
                          className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-purple-500/50 text-left transition-all cursor-pointer group"
                        >
                          <span className="text-xs font-bold text-white group-hover:text-purple-400 block">{opt.title}</span>
                          <span className="text-[11px] text-zinc-400 mt-1 block">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-base font-bold text-white">3. Your essential aesthetic element?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'rope', title: 'Rope Art & Shibari Aesthetics', desc: 'Tactile friction, anatomical safety, and artistic patterns.' },
                        { id: 'sensory', title: 'Sensory Deprivation & Sound', desc: 'Silk blindfolds, ambient frequencies, quiet touch.' },
                        { id: 'aftercare', title: 'Mindful Aftercare & Tea', desc: 'Restorative warmth, weighted blankets, quiet grounding.' },
                        { id: 'chemistry', title: 'Masked Chemistry & Intrigue', desc: 'Connecting with vetted peers under complete anonymity.' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setQuizAnswers({ ...quizAnswers, element: opt.id });
                            setQuizCompleted(true);
                          }}
                          className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                        >
                          <span className="text-xs font-bold text-white group-hover:text-amber-400 block">{opt.title}</span>
                          <span className="text-[11px] text-zinc-400 mt-1 block">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn text-center">
                {(() => {
                  const res = getArchetypeResult();
                  return (
                    <div className="p-6 sm:p-8 bg-zinc-900/90 border border-rose-500/30 rounded-2xl space-y-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold rounded-full">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Archetype Diagnosed • {res.matchPercent}% Alignment</span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">{res.title}</h3>
                      <p className="text-xs text-rose-300 font-mono">{res.tagline}</p>

                      <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed italic">
                        "{res.desc}"
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono text-left">
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block text-[10px]">PEER MATCHES</span>
                          <span className="text-emerald-400 font-bold">{res.membersCount} Verified Members in NCR</span>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block text-[10px]">RECOMMENDED SOIRÉE</span>
                          <span className="text-purple-400 font-bold">{res.recommendedEvent}</span>
                        </div>
                        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <span className="text-zinc-500 block text-[10px]">SANCTUARY SUITE</span>
                          <span className="text-amber-400 font-bold">{res.recommendedSuite}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={onOpenActivation}
                          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Claim Moniker &amp; Unlock These Matches</span>
                        </button>
                        <button
                          onClick={() => {
                            setQuizStep(1);
                            setQuizCompleted(false);
                          }}
                          className="px-4 py-3 text-zinc-400 hover:text-white text-xs font-mono"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. UPCOMING SECRET SOIRÉES & GATHERINGS SHOWCASE (BIG REVENUE) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-zinc-900">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" /> Exclusive Sanctuary Gatherings
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Secret Salons &amp; Noir Masquerades
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Strictly capped, ratio-balanced, and protected by tamper-proof camera bans. Held at confidential penthouse sanctuaries across Delhi.
            </p>
          </div>

          <Link
            href="/sanctuary-pass"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 hover:from-amber-500 hover:to-rose-500 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Explore Sanctuary Pass Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Flagship Gathering Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Gathering 1: Velvet Masquerade */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold uppercase">
                  Tier 2 • Masquerade Rave
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> This Saturday
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                The Velvet Masquerade: Midnight Noir
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                Secret multi-level South Delhi penthouse. Live dark ambient vinyl, craft bar, quiet conversation alcoves, and mandatory custom velvet &amp; leather masks.
              </p>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1 text-[11px] font-mono text-zinc-400">
                <div>Dress: <span className="text-white font-bold">Silk &amp; Velvet Masks</span></div>
                <div>Coordinates: <span className="text-purple-300">Revealed 3h Prior</span></div>
                <div className="text-emerald-400 font-bold pt-1">Only 2 Couple Passes Left</div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">From ₹1,999</span>
              <Link href="/sanctuary-pass" className="text-rose-400 hover:text-white flex items-center gap-1 font-bold">
                View Dossier →
              </Link>
            </div>
          </div>

          {/* Gathering 2: Rope & Reverie */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold uppercase">
                  Tier 1 • Dialogue Salon
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> This Thursday
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                Rope &amp; Reverie: Shibari Dialogue
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                Technical Japanese suspension demonstrations, anatomical nerve safety discussion, and mindful aftercare protocols over curated wine and quiet sound.
              </p>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1 text-[11px] font-mono text-zinc-400">
                <div>Dress: <span className="text-white font-bold">Textured Linen Noir</span></div>
                <div>Lead: <span className="text-rose-300">Master Rigger Dev</span></div>
                <div className="text-emerald-400 font-bold pt-1">80% Passes Claimed</div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">From ₹1,499</span>
              <Link href="/sanctuary-pass" className="text-rose-400 hover:text-white flex items-center gap-1 font-bold">
                View Dossier →
              </Link>
            </div>
          </div>

          {/* Gathering 3: The Obsidian Soirée */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Tier 3 • Intimate Soirée
                </span>
                <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> In 14 Days
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                The Obsidian Soirée: Deep Surrender
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                Strictly capped to 8 couples. Sensory bath soaks, industrial ceiling suspension rigs, sensory isolation chambers, and bespoke champagne service.
              </p>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1 text-[11px] font-mono text-zinc-400">
                <div>Dress: <span className="text-white font-bold">Dark Silk Robes</span></div>
                <div>Cap: <span className="text-amber-300">Strictly 8 Couples</span></div>
                <div className="text-amber-400 font-bold pt-1">Application Vetting Open</div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">From ₹2,999</span>
              <Link href="/sanctuary-pass" className="text-rose-400 hover:text-white flex items-center gap-1 font-bold">
                View Dossier →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. SANCTUARY WHISPERS & AUDIO CONFESSIONALS                   */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="p-1 rounded-3xl bg-gradient-to-r from-zinc-800 via-rose-950/40 to-zinc-800 shadow-2xl">
          <div className="bg-zinc-950 rounded-[22px] p-6 sm:p-10 space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Anonymous Voice Vault
                </span>
                <h3 className="text-2xl font-bold text-white font-serif mt-1">
                  Sanctuary Whispers &amp; Confessionals
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Discreet 10s voice notes from verified guests
              </span>
            </div>

            {/* Whisper Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SANCTUARY_WHISPERS.map((w, i) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setActiveWhisperIdx(i);
                    setIsPlayingWhisper(false);
                  }}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    activeWhisperIdx === i
                      ? 'bg-rose-950/50 border-rose-500/50 text-white shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-mono text-amber-400 block">{w.confessionId}</span>
                  <span className="text-xs font-bold block truncate">{w.moniker}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{w.duration}</span>
                </button>
              ))}
            </div>

            {/* Active Whisper Audio Display */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlayingWhisper(!isPlayingWhisper)}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-xl shrink-0 cursor-pointer"
                  >
                    {isPlayingWhisper ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{activeWhisper.audioTitle}</h4>
                    <p className="text-xs text-rose-300 font-mono">{activeWhisper.moniker} • {activeWhisper.category}</p>
                  </div>
                </div>

                {/* Animated Soundwave */}
                <div className="flex items-center gap-1.5 h-6 px-3">
                  {[0.3, 0.7, 1, 0.5, 0.8, 0.4, 0.9, 0.6, 0.8, 0.4, 0.9, 0.3].map((scale, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full bg-rose-400 transition-all duration-300 ${
                        isPlayingWhisper ? 'animate-pulse' : 'opacity-30'
                      }`}
                      style={{
                        height: isPlayingWhisper ? `${Math.max(6, scale * 24)}px` : '6px',
                        animationDelay: `${idx * 80}ms`
                      }}
                    />
                  ))}
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-zinc-300 italic font-serif leading-relaxed pl-4 border-l-2 border-rose-500/60">
                "{activeWhisper.quote}"
              </blockquote>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. SPONTANEOUS SUITE INVITES & FLEXIBLE PAYMENT               */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-mono flex items-center justify-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-400" /> Spontaneous Space Sharing
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Invite Matches to Explore Suites &amp; Share Tariffs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Vibe with a member or couple? Send an instant invitation to reserve a sanctuary suite together with flexible upfront payment: split 50/50 or sponsor 100% upfront.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
              Flexible Payment Choice
            </span>
            <h4 className="text-base font-bold text-white">50/50 Split or 100% Full Payment</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dono parties me se koi bhi poora payment upfront kar sakta hai (100% host sponsored as an invitation), ya fir equal 50/50 split choose kar sakte hain. Jaise hi full tariff booking me clear hota hai, reservation confirm ho jati hai.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Direct Arrival or Chat First
            </span>
            <h4 className="text-base font-bold text-white">Pre-Verified ID &amp; Secret Key</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Align in private chat first or initiate a spontaneous booking invite to meet directly upon arrival. Because all members are pre-verified, entry is seamless with secret key retrieval.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              host: '@kinkster_architect',
              suite: 'The Void Suite (South Delhi)',
              timing: 'This Saturday Night • Post-Munch Session',
              desc: 'Booked full penthouse suite with deep soaking bath & 300kg ceiling suspension points. 100% Suite Tariff Covered by Host. Seeking 1 vetted switch guest to explore sound & suspension.',
              splitRate: '100% Host Sponsored (₹0 for Guest)',
              isSponsored: true,
              status: 'Invite Active'
            },
            {
              host: '@velvet_nocturne',
              suite: 'The Brutalist Atelier Suite',
              timing: 'Upcoming Friday Evening',
              desc: 'Japanese floor rope & ambient vinyl immersion. Proposing equal 50/50 split paid at booking to lock the suite together.',
              splitRate: '₹4,250 / share (50/50 Split at Booking)',
              isSponsored: false,
              status: '1 Slot Open'
            },
            {
              host: '@obsidian_silk_duo',
              suite: 'The Obsidian Soaking Suite',
              timing: 'Upcoming Sunday Retreat',
              desc: 'Sensory candlelight soak and deep acoustic privacy. Seeking vetted female switch or couple to share suite tariff and explore mutual chemistry.',
              splitRate: '₹3,900 / share (50/50 Split at Booking)',
              isSponsored: false,
              status: 'Open Invite'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-400">{item.host}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">• {item.timing}</span>
                  {item.isSponsored && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold">
                      Fully Hosted
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{item.suite}</h4>
                <p className="text-xs text-zinc-400 max-w-xl">{item.desc}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                <span className={`text-xs font-mono font-bold ${item.isSponsored ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {item.splitRate}
                </span>
                <button
                  onClick={onOpenActivation}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer"
                >
                  {item.isSponsored ? 'Accept Invitation' : 'Accept & Split Suite'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. SINGLE LIFETIME KINKSTER MEMBERSHIP PASS (ADMIN CONTROLLED) */}
      {/* ------------------------------------------------------------- */}
      <section id="membership-pass" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center justify-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" /> One-Time Initiation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Lifetime Kinkster Mode Activation
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            A single, one-time entry barrier to eliminate spam, bots, and casual voyeurs. Zero recurring subscriptions.
          </p>
        </div>

        {/* Single Transparent Membership Card */}
        <div className="p-1 rounded-3xl bg-gradient-to-br from-amber-500/40 via-rose-500/30 to-purple-600/40 shadow-2xl">
          <div className="bg-zinc-950 rounded-[22px] p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block mb-1">
                  Official Lifetime Membership
                </span>
                <h3 className="text-2xl font-bold text-white font-serif">The Sovereign Kinkster Pass</h3>
                <p className="text-xs text-zinc-400 mt-1">One fee. Lifetime access. 100% confidential.</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="text-4xl font-extrabold font-mono text-white">
                    {entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : '₹1,499'}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/ one-time</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">Defined by Nothingness Admin</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
              <div className="flex items-start gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Permanent Private Moniker</strong>
                  <span className="text-[11px] text-zinc-400">Choose your unique @alias; your legal identity is never shown to members.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Mutual Spark Direct Messaging</strong>
                  <span className="text-[11px] text-zinc-400">Direct chats unlock solely upon mutual resonance. Zero cold messages or spam.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Sanctuary Munches Invitation (Level 1)</strong>
                  <span className="text-[11px] text-zinc-400">Eligible to attend relaxed social Munches where in-person certification takes place.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Spontaneous Suite Invites &amp; Rent Split</strong>
                  <span className="text-[11px] text-zinc-400">Invite matched kinksters to explore suites and split reservation tariffs 50/50.</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenActivation}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all cursor-pointer"
              >
                Activate Kinkster Mode ({entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : '₹1,499'}) →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. THE SANCTUARY CODE: 300KG FIXTURES & HYGIENE STANDARDS     */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> The Sanctuary Code
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Safety, Structural Load &amp; Hygiene Reality
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Uncompromising standards tested and maintained for every single reservation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
              01
            </div>
            <h4 className="text-sm font-bold text-white">Traffic Light Safe Words</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standardized Red (Stop), Amber (Adjust intensity), Green (Affirmative flow). Always respected immediately without debate.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono font-bold text-xs">
              02
            </div>
            <h4 className="text-sm font-bold text-white">Non-Verbal Double Tap</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              When blindfolded, gagged, or focused inward, two rapid physical taps on any surface signal immediate release and pause.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-xs">
              03
            </div>
            <h4 className="text-sm font-bold text-white">300 kg Load Tested</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Wall-mounted chains and anchor points installed in suites are structurally tested to safely support up to <strong>300 kg load</strong>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
              04
            </div>
            <h4 className="text-sm font-bold text-white">Chemically Washed Linens</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bedsheets and pillow covers are changed fresh for every single booking and professionally chemically laundered. All surfaces sanitized.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. SANCTUARY SUITES: Real-Time Active Spaces From DB         */}
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
                    <div className="relative aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img
                        src={displayImage}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600';
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
                        {space.description || 'Private intimate sanctuary in Delhi featuring discreet luxury amenities, dedicated kink-friendly architecture, and total privacy.'}
                      </p>
                    </div>
                  </div>

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
      {/* 11. FINAL MAGNETIC CTA: Claim Your Moniker                    */}
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
