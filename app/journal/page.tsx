import { Metadata } from 'next';
import { getPublishedArticles } from '@/app/actions/journal';
import JournalClient from './JournalClient';
import JsonLd, { generateBreadcrumbSchema, generateWebSiteSchema } from '@/components/JsonLd';
import { Sparkles } from 'lucide-react';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: 'Editorial Journal | Alternate Lifestyle, Dynamics & Intimacy in India',
  description: 'In-depth essays on relationship dynamics, power exchange, consent culture, sensory exploration, and judgment-free private living across urban India.',
  keywords: [
    'alternate lifestyle india',
    'power dynamics relationships',
    'shibari beginner guide india',
    'aftercare guide couples',
    'sensory intimacy exploration',
    'kink community delhi ncr',
    'private sanctuaries india',
    'discreet couples stays'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/journal',
  },
  openGraph: {
    title: 'Editorial Journal | Nothingness',
    description: 'Essays on alternate lifestyle, relationship dynamics, kink safety, sensory exploration, and discreet sanctuaries in India.',
    url: 'https://nothingness.asia/journal',
    siteName: 'Nothingness',
    images: [
      {
        url: '/images/IMG_9955.jpg',
        width: 1200,
        height: 630,
        alt: 'Nothingness Editorial Journal',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Editorial Journal | Nothingness',
    description: 'Essays on alternate lifestyle, relationship dynamics, kink safety, sensory exploration, and discreet sanctuaries in India.',
    images: ['/images/IMG_9955.jpg'],
  },
};

export default async function JournalPage() {
  const articles = await getPublishedArticles();

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/journal' },
  ];

  return (
    <main className="min-h-screen pt-32 sm:pt-36 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-12">
      {/* Schema Structured Data */}
      <JsonLd data={generateWebSiteSchema()} id="journal-website-schema" />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="journal-breadcrumb-schema" />

      {/* Page Header Banner */}
      <div className="border-b border-white/10 pb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-accent-gold text-[11px] font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Alternate Lifestyle, Intimacy &amp; Cultural Dynamics</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.08]">
              The Editorial <span className="italic text-accent-gold">Journal</span>.
            </h1>
            <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mt-3 leading-relaxed font-sans">
              Essays and guides on power dynamics, consent culture, aftercare, sensory exploration, and navigating alternative intimacy within the Indian socio-cultural reality.
            </p>
          </div>

          <div className="hidden lg:block text-right">
            <p className="text-xs font-mono uppercase tracking-widest text-accent-gold">Editorial Archives</p>
            <p className="font-serif text-2xl text-white font-bold mt-0.5">20 Published Works</p>
            <p className="text-[10px] text-white/40 font-mono mt-1">Delhi NCR • Mumbai • Bangalore</p>
          </div>
        </div>
      </div>

      {/* Interactive Journal Client */}
      <JournalClient initialArticles={articles} />
    </main>
  );
}
