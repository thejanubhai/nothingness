import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Megaphone, 
  Building2, 
  UtensilsCrossed, 
  Car, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Coffee 
} from 'lucide-react';
import PartnerCalculator from '@/components/franchise/PartnerCalculator';
import ExpansionRoadmap from '@/components/franchise/ExpansionRoadmap';
import PartnerApplicationForm from '@/components/franchise/PartnerApplicationForm';
import PartnerFaq from '@/components/franchise/PartnerFaq';
import PartnerOnboardingBanner from '@/components/franchise/PartnerOnboardingBanner';
import JsonLd, { generateBreadcrumbSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Partner with Us | High-Yield Private Sanctuary Real Estate Network India',
  description: 'Join the Nothingness Partner Network. High-yield, turnkey private sanctuaries with 70/30 revenue share, budget & luxury fit-outs, and pan-India expansion.',
  keywords: [
    'hotel franchise india',
    'boutique sanctuary partner',
    'airbnb management delhi ncr',
    'high yield hospitality real estate',
    'private stay franchise model'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/franchise',
  },
  openGraph: {
    title: 'Partner with Us | Nothingness Real Estate Network',
    description: 'Transform residential real estate into high-yield private sanctuaries with 2.5x to 3x higher returns.',
    url: 'https://nothingness.asia/franchise',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function FranchisePage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Partner', url: '/franchise' }
  ];

  return (
    <main className="min-h-screen pt-28 sm:pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-24 sm:space-y-32">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="franchise-breadcrumb-schema" />
      
      {/* Logged-in Member Fast-Track Onboarding Banner */}
      <PartnerOnboardingBanner />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="text-center relative overflow-hidden pt-6 sm:pt-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent-gold/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-accent-gold text-[11px] font-mono uppercase tracking-widest shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>nothingness. Partner Network</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.08]">
            Transform Real Estate into <br />
            <span className="italic text-accent-gold">High-Yield Private Sanctuaries</span>.
          </h1>

          <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Partner with <span className="font-mono text-white">nothingness.</span> to launch autonomous, hyperlocalised private sanctuaries. From ₹3L PAN India setup and cost-to-cost fit-outs to integrated vetted events and gated member lounges.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#calculator-section"
              className="w-full sm:w-auto bg-accent-gold hover:bg-white text-black px-8 py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Model Your Returns</span>
            </a>

            <a
              href="#apply-section"
              className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/10 text-white border border-white/15 px-8 py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Apply as Partner</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Setup Fee</p>
              <p className="font-serif text-xl sm:text-2xl text-accent-gold font-bold mt-0.5">₹3 Lakhs</p>
              <p className="text-[10px] text-white/50 mt-1">PAN India operational setup</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Fit-Out Landing</p>
              <p className="font-serif text-xl sm:text-2xl text-white font-bold mt-0.5">₹1L – ₹4L</p>
              <p className="text-[10px] text-white/50 mt-1">Cost-to-cost budget / luxury</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Average Yield</p>
              <p className="font-serif text-xl sm:text-2xl text-emerald-400 font-bold mt-0.5">2.5x – 3x</p>
              <p className="text-[10px] text-white/50 mt-1">vs residential leasing</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Discretion &amp; ID</p>
              <p className="font-serif text-xl sm:text-2xl text-white font-bold mt-0.5">100%</p>
              <p className="text-[10px] text-white/50 mt-1">State Police &amp; Govt ID Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. WHAT YOU GET AS A NOTHINGNESS. PARTNER (Bento Grid)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/80 font-mono mb-2">
            The Partner Advantage
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-white">
            What Becoming a <span className="text-accent-gold italic">nothingness.</span> Partner Includes
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-3 leading-relaxed">
            A comprehensive, high-margin hospitality ecosystem designed for maximum revenue, zero operational headaches, and absolute guest discretion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Vetted Events Business */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-accent-gold/30 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-white">
                Vetted Members-Only Events Access
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Direct integration into our private lifestyle and creative members network. Generate auxiliary revenue through member ticketing, curated host gatherings, and networking systems.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between text-xs font-mono text-accent-gold">
              <span>Integrated Revenue Stream</span>
              <span>+₹15K–₹35K/mo</span>
            </div>
          </div>

          {/* Card 2: Local Marketing & Promotions */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-accent-gold/30 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-white">
                Discreet Local Marketing &amp; PR
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                We handle hyper-targeted local digital promotions, editorial features, and algorithmic guest routing without public signage or noise, maintaining complete property discretion.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between text-xs font-mono text-white/50">
              <span>Zero Signage Overhead</span>
              <span>100% Digital Flow</span>
            </div>
          </div>

          {/* Card 3: Optimised Apartment Hotel Business */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-accent-gold/30 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-white">
                Stable High-Yield Apartment Hotel
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Autonomous WhatsApp smart lockbox access, dynamic RevPAR pricing, automated housekeeping dispatch, and continuous high-occupancy guest booking pipeline.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Autonomous Keyless Ops</span>
              <span>92%+ Occupancy</span>
            </div>
          </div>

          {/* Card 4: Local Co-ordination & Vendor Ecosystem (Span 2 on lg) */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-accent-gold/30 transition-all flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white">
                  Local Services, Valet &amp; Dining Integration
                </h3>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Turnkey operational setups including parking &amp; valet co-ordination, reliable linen and consumable vendors, and in-suite curated food &amp; beverage service integrations.
                </p>
              </div>

              <div className="space-y-2.5 sm:border-l sm:border-white/5 sm:pl-6 text-xs text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                  <span>Cost-to-cost transparent vendor pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                  <span>Curated in-suite dining &amp; beverage setups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                  <span>Discreet valet &amp; dedicated parking logistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                  <span>100% Digital State Police &amp; Licensing Compliance (Zero Harassment)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: nothingness. Lounge Unlock */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-accent-gold/30 hover:border-accent-gold transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-accent-gold">
                <Coffee className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest font-mono text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full border border-accent-gold/20">
                  Exclusive Multi-Unit Unlock
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-white pt-1">
                  nothingness. Lounge
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Gated community lounge exclusively for vetted <span className="font-mono text-white">nothingness.</span> members. Unlocks as a dedicated revenue stream when operating <span className="text-white font-semibold">more than 2 properties in the same state</span>.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-xs font-mono text-accent-gold font-bold">
              <span>F&amp;B + Membership Share</span>
              <span>+₹45,000/mo</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SPACE TIERS: BUDGET VS LUXURY SANCTUARY
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/80 font-mono mb-2">
            Tailored Fit-Out Blueprint
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-white">
            Budget &amp; Luxury <span className="text-accent-gold italic">Space Options</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-3 leading-relaxed">
            Every property is crafted on a 100% cost-to-cost landing basis. Choose the format that aligns with your real estate footprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Option A: Budget Space */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                  Option 01
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white mt-3">Budget Private Sanctuary</h3>
                <p className="text-xs text-white/60 mt-1">Lean, minimalist, high-turnover sanctuary</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white/40 uppercase">Landing Fit-Out</p>
                <p className="font-serif text-2xl text-white font-bold">₹1L – ₹2L</p>
                <p className="text-[10px] text-white/40 font-mono">per space</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Designed for compact urban apartments and boutique studios. Focuses on high-efficiency mood lighting, acoustic dampening, clean minimalist furnishings, and autonomous check-in hardware.
            </p>

            <ul className="space-y-2.5 text-xs text-white/60 border-t border-white/5 pt-6">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                <span>Standard Nightly Rate (ADR): ₹2,800 – ₹4,000 / night</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                <span>Smart Lockbox &amp; IoT Keyless entry integration</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                <span>Acoustic buffering &amp; ambient cinematic low-lux lighting</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                <span>Estimated payback period: 6 – 9 months</span>
              </li>
            </ul>
          </div>

          {/* Option B: Luxury Space */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-accent-gold/40 hover:border-accent-gold transition-all space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                  Option 02 · Flagship
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white mt-3">Luxury Private Sanctuary</h3>
                <p className="text-xs text-accent-gold mt-1">Bespoke sensory design &amp; peak RevPAR</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-accent-gold uppercase">Landing Fit-Out</p>
                <p className="font-serif text-2xl text-accent-gold font-bold">₹2L – ₹4L</p>
                <p className="text-[10px] text-white/40 font-mono">per space</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed relative z-10">
              Tailored for luxury penthouses, duplexes, and private floors. Incorporates sensory architectural lighting, bespoke high-grade fabrics, superior acoustic isolation, and curated in-suite amenities.
            </p>

            <ul className="space-y-2.5 text-xs text-white/70 border-t border-white/10 pt-6 relative z-10">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                <span>Standard Nightly Rate (ADR): ₹6,000 – ₹9,500+ / night</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                <span>High-end textured finishes, sensory lighting &amp; discreet decor</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                <span>Premium linen &amp; luxury bath amenities partnership</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0" />
                <span>Estimated payback period: 8 – 12 months</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. INTERACTIVE ROI CALCULATOR SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="calculator-section" className="scroll-mt-24">
        <PartnerCalculator />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PAN-INDIA EXPANSION ROADMAP
          ───────────────────────────────────────────────────────────── */}
      <ExpansionRoadmap />

      {/* ─────────────────────────────────────────────────────────────
          6. ONBOARDING JOURNEY (4 STEPS)
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/80 font-mono mb-2">
            Seamless Onboarding Flow
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-white">
            From Application to <span className="text-accent-gold italic">Active Cashflow</span>
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-3">
            Our step-by-step launch protocol takes your property from audit to fully booked within 14–21 days.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Setup Fee & 70/30 MoU',
              desc: 'Pay the ₹3L PAN India setup fee and execute the digital 70/30 franchise MoU governed under Indian Contract Act 1872 & state hospitality norms.'
            },
            {
              step: '02',
              title: 'Property NOC Affidavit',
              desc: 'Mandatory property ownership verification. Print our generated NOC draft, notarize on stamp paper, and upload for manual admin approval.'
            },
            {
              step: '03',
              title: 'Fit-Out & Vendor Setup',
              desc: 'Cost-to-cost landing fit-out (₹1-2L Budget / ₹2-4L Luxury), smart keyless lockboxes, linen supply chain, valet & dining integrations.'
            },
            {
              step: '04',
              title: 'Partner Dashboard & Cashflow',
              desc: 'Instant access to your hyper-personalised Partner Dashboard, 1-click legal guest printouts, live bookings, and gated Lounge activation.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="font-mono text-xs text-accent-gold font-bold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                Step {item.step}
              </span>
              <h3 className="font-serif text-lg text-white font-semibold pt-1">{item.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FREQUENTLY ASKED QUESTIONS
          ───────────────────────────────────────────────────────────── */}
      <PartnerFaq />

      {/* ─────────────────────────────────────────────────────────────
          8. APPLICATION & PROSPECTUS FORM SECTION
          ───────────────────────────────────────────────────────────── */}
      <PartnerApplicationForm />

    </main>
  );
}
