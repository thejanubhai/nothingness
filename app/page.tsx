import React from 'react';
import PropertySwipeDeck from '@/components/PropertySwipeDeck';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Link from 'next/link';
import { ShieldCheck, Key, Sparkles, Building2, Smartphone, Calendar, Award } from 'lucide-react';
import { Metadata } from 'next';
import JsonLd, { generateWebSiteSchema } from '@/components/JsonLd';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: "Cinematic Private Stays & Luxury Sanctuaries in Delhi NCR | Nothingness",
  description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Autonomous keyless check-in, Jacuzzi bath soaks, brutalist interiors, and 100% ID-vetted discretion in Delhi NCR.",
  alternates: {
    canonical: 'https://nothingness.asia',
  },
  openGraph: {
    title: 'Cinematic Private Stays & Luxury Sanctuaries | Nothingness',
    description: "Ultra-discreet, design-forward private sanctuaries with keyless digital check-in and Jacuzzi tubs across Delhi NCR.",
    url: 'https://nothingness.asia',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-500/30">
      <JsonLd data={generateWebSiteSchema()} id="home-website-schema" />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center overflow-hidden">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-zinc-900/80 border border-zinc-800 text-rose-400 text-xs font-mono font-bold rounded-full shadow-lg">
            <Sparkles className="w-3.5 h-3.5" /> India's Premier Luxury Private Sanctuaries
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-serif tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Cinematic Private Stays. <br />
            <span className="bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
              Ultra-Discreet Hospitality.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            High-design private sanctuaries featuring keyless digital check-in, Jacuzzi bath soaks, aesthetic interiors, and 100% ID-vetted discretion.
          </p>
        </div>
      </section>

      {/* Interactive Swipe-to-Switch Property Card Deck */}
      <section className="py-6 pb-16 px-4 sm:px-6">
        <PropertySwipeDeck />
      </section>

      {/* Trust & Discretion Highlights (Payment Gateway Friendly) */}
      <section className="py-16 bg-zinc-950 border-t border-b border-zinc-900 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">100% Autonomous Keyless Check-In</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No front desk lines or intrusion. Receive your encrypted lockbox pin directly on WhatsApp 30 minutes before check-in.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Digital State Police &amp; Govt ID Compliance</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              100% online guest vetting compliant with state hospitality regulations. 180-day reusable Aadhaar &amp; Passport ID verification prevents local harassment &amp; guarantees discretion.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">Aesthetic Cinematic Interiors</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Custom mood lighting, private Jacuzzi tubs, plush bedding, and high-speed Wi-Fi designed for relaxation and photo aesthetics.
            </p>
          </div>

        </div>
      </section>

      {/* PWA Home Screen Installation Banner */}
      <PWAInstallPrompt />
    </div>
  );
}
