import React from 'react';
import PropertySwipeDeck from '@/components/PropertySwipeDeck';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Link from 'next/link';
import { ShieldCheck, Key, Sparkles, Building2, Smartphone, Calendar, Award, Flame } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import JsonLd, { generateWebSiteSchema } from '@/components/JsonLd';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60; // Revalidate every 60s for fresh CMS edits

export const metadata: Metadata = {
  title: "Cinematic Private Stays & Luxury Sanctuaries in Delhi NCR | Nothingness",
  description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Discreet private check-in, Jacuzzi bath soaks, brutalist interiors, and 100% ID-vetted discretion in Delhi NCR.",
  alternates: {
    canonical: 'https://nothingness.asia',
  },
  openGraph: {
    title: 'Cinematic Private Stays & Luxury Sanctuaries | Nothingness',
    description: "Ultra-discreet, design-forward private sanctuaries with total privacy and Jacuzzi tubs across Delhi NCR.",
    url: 'https://nothingness.asia',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, guide them straight to their Member Portal / App Hub
  if (user) {
    redirect('/dashboard');
  }

  const { data: cmsBlocks } = await supabase
    .from('cms_content_blocks')
    .select('block_key, title, subtitle, body, is_active');

  const getBlock = (key: string, defaults: { title: string; subtitle?: string; body?: string }) => {
    const found = cmsBlocks?.find((b: any) => b.block_key === key && b.is_active !== false);
    return {
      title: found?.title ?? defaults.title,
      subtitle: found?.subtitle ?? defaults.subtitle ?? '',
      body: found?.body ?? defaults.body ?? '',
    };
  };

  const hero = getBlock('homepage_hero', {
    title: 'Cinematic Private Stays.',
    subtitle: 'Ultra-Discreet Hospitality.',
    body: 'High-design private sanctuaries featuring total acoustic privacy, Jacuzzi bath soaks, aesthetic interiors, and 100% ID-vetted discretion.'
  });

  const badge = getBlock('homepage_badge', {
    title: "India's Premier Luxury Private Sanctuaries"
  });

  const trust1 = getBlock('trust_card_1', {
    title: 'Discreet Private Check-In',
    body: 'Arrive peacefully with zero judgement or awkward front-desk questioning. Confidential arrival directions and dedicated hospitality support prepared prior to your stay.'
  });

  const trust2 = getBlock('trust_card_2', {
    title: '100% Private & Verified',
    body: 'Fast, discreet online verification before arrival. Your legal identity remains strictly private and protected, guaranteeing complete peace of mind and hassle-free stays.'
  });

  const trust3 = getBlock('trust_card_3', {
    title: 'Aesthetic Cinematic Suites',
    body: 'Deep soaking jacuzzi tubs, warm ambient candle lighting, acoustic privacy, and custom sensory amenities designed for ultimate relaxation and connection.'
  });

  const lifestyle = getBlock('lifestyle_showcase', {
    title: 'Where High Discretion Meets Raw Chemistry.',
    subtitle: 'The Lifestyle Circle • Private Monikers',
    body: 'An intimate, confidential society reserved exclusively for verified guests of Nothingness. Connect under complete anonymity with private @aliases, explore deep aesthetic chemistry, and unlock private sanctuary suites. Protected by a one-time lifetime membership entry barrier.'
  });

  const sanctuary = getBlock('sanctuary_pass_showcase', {
    title: 'Nothingness Sanctuary Pass',
    subtitle: 'Exclusive Members Access',
    body: 'Unlock private discussion salons, midnight noir masquerades, and strictly vetted intimate soirées across official Nothingness sanctuaries. Ratio-balanced, consent-governed, and protected by tamper-proof camera bans.'
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-500/30">
      <JsonLd data={generateWebSiteSchema()} id="home-website-schema" />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-zinc-900/80 border border-zinc-800 text-rose-400 text-xs font-mono font-bold rounded-full shadow-lg">
            <Sparkles className="w-3.5 h-3.5" /> {badge.title}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-serif tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {hero.title} <br />
            <span className="bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              {hero.subtitle}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {hero.body}
          </p>
        </div>
      </section>

      {/* Interactive Swipe-to-Switch Property Card Deck */}
      <section className="py-6 pb-16 px-4 sm:px-6">
        <PropertySwipeDeck />
      </section>

      {/* Trust & Discretion Highlights */}
      <section className="py-16 bg-zinc-950 border-t border-b border-zinc-900 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">{trust1.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {trust1.body}
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">{trust2.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {trust2.body}
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">{trust3.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {trust3.body}
            </p>
          </div>

        </div>
      </section>

      {/* Nothingness Lifestyle Circle Showcase */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/40 via-zinc-950 to-purple-950/30 border border-rose-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>{lifestyle.subtitle}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-white leading-tight">
              {lifestyle.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {lifestyle.body}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-rose-400 font-bold font-mono block">100% Anonymous</span>
                <span className="text-[11px] text-zinc-400">Real names never revealed to other members</span>
              </div>
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-purple-400 font-bold font-mono block">Mutual Spark DMs</span>
                <span className="text-[11px] text-zinc-400">Direct messaging unlocks solely on mutual desire</span>
              </div>
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-amber-400 font-bold font-mono block">Verified Guests Only</span>
                <span className="text-[11px] text-zinc-400">Zero bots, fake accounts, or strangers</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/kinksters"
                className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-2 active:scale-98"
              >
                <Flame className="w-4 h-4" />
                <span>Explore Lifestyle Circle &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sanctuary Pass & Secret Gatherings Showcase */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-950 to-purple-950/30 border border-amber-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{sanctuary.subtitle}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-white leading-tight">
              {sanctuary.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {sanctuary.body}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-amber-400 font-bold text-xs font-mono block">Tier 1: Salons &amp; Munches</span>
                <span className="text-[11px] text-zinc-400">Power dynamics, Shibari &amp; dialogue</span>
              </div>
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-rose-400 font-bold text-xs font-mono block">Tier 2: Noir Masquerades</span>
                <span className="text-[11px] text-zinc-400">Sensory techno &amp; masked anonymity</span>
              </div>
              <div className="p-3.5 bg-black/50 border border-zinc-800/80 rounded-2xl">
                <span className="text-purple-400 font-bold text-xs font-mono block">Tier 3: Intimate Soirées</span>
                <span className="text-[11px] text-zinc-400">Strictly capped play &amp; sanctuary floor leads</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/sanctuary-pass"
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center gap-2 active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Sanctuary Pass &amp; Vault →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured From Editorial Journal Section */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-accent-gold text-[10px] font-mono uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>The Editorial Journal</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">
              Intimacy, Dynamics &amp; Sanctuary Culture
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-sans">
              Curated essays, step-by-step guides, and real anonymous stories on power dynamics, Shibari, aftercare, and discretion in India.
            </p>
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-gold hover:text-white transition-colors self-start md:self-auto group"
          >
            <span>Explore All 30 Works</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Power Dynamics */}
          <Link
            href="/journal/power-dynamics-modern-indian-relationships"
            className="group p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-accent-gold/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold text-[9px] font-mono uppercase tracking-widest font-bold">
                  Dynamics &amp; Kink
                </span>
                <span className="text-[10px] font-mono text-zinc-500">7 min read</span>
              </div>
              <h3 className="font-serif text-lg text-white group-hover:text-accent-gold transition-colors leading-snug">
                Navigating Power Dynamics in Modern Indian Relationships: Beyond the Taboo
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                Why conscious consensual submission and dominance have nothing to do with patriarchy, and how modern couples find freedom through power exchange.
              </p>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold group-hover:translate-x-1 transition-transform flex items-center gap-1 pt-2 border-t border-white/5">
              <span>Read Deep Dive</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 2: Shibari Guide */}
          <Link
            href="/journal/how-to-tie-single-column-shibari-guide"
            className="group p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-accent-gold/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[9px] font-mono uppercase tracking-widest font-bold">
                  📖 How-To Guide
                </span>
                <span className="text-[10px] font-mono text-zinc-500">8 min read</span>
              </div>
              <h3 className="font-serif text-lg text-white group-hover:text-accent-gold transition-colors leading-snug">
                How to Tie a Single Column Tie: Step-by-Step Shibari Anatomy &amp; Rope Guide
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                A beginner-friendly technical guide to tying your first single column tie safely, understanding wrist nerve pathways, and establishing consent.
              </p>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold group-hover:translate-x-1 transition-transform flex items-center gap-1 pt-2 border-t border-white/5">
              <span>Read Guide</span>
              <span>→</span>
            </div>
          </Link>

          {/* Card 3: Unmarried Rights Handbook */}
          <Link
            href="/journal/the-unmarried-couples-legal-and-safety-handbook-india"
            className="group p-6 rounded-3xl bg-zinc-950 border border-zinc-900 hover:border-accent-gold/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-mono uppercase tracking-widest font-bold">
                  ⚖️ Legal Handbook
                </span>
                <span className="text-[10px] font-mono text-zinc-500">8 min read</span>
              </div>
              <h3 className="font-serif text-lg text-white group-hover:text-accent-gold transition-colors leading-snug">
                The Unmarried Couples Legal &amp; Safety Handbook: Rights &amp; Police Protocols
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                Everything you need to know about Article 21 privacy rights, Supreme Court precedents, and asserting your rights calmly against moral policing.
              </p>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent-gold group-hover:translate-x-1 transition-transform flex items-center gap-1 pt-2 border-t border-white/5">
              <span>Read Handbook</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* PWA Home Screen Installation Banner */}
      <PWAInstallPrompt />
    </div>
  );
}
