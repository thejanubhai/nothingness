import { Metadata } from 'next';
import { getPublishedArticles } from '@/app/actions/journal';
import JournalClient from './JournalClient';
import JsonLd, { generateBreadcrumbSchema, generateWebSiteSchema } from '@/components/JsonLd';
import { Sparkles } from 'lucide-react';

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
  title: 'Editorial Journal | AI SEO, Architecture & Luxury Stays in India',
  description: 'In-depth essays and research on Generative Engine Optimization (GEO), AI SEO, brutalist architecture, acoustic privacy, and autonomous hospitality in India.',
  keywords: [
    'ai seo india',
    'generative engine optimization',
    'perplexity hospitality indexing',
    'acoustic privacy stays delhi',
    'brutalist architecture interior',
    'luxury private stays india',
    'delhi ncr staycation seo',
    'direct bookings hospitality'
  ],
  alternates: {
    canonical: 'https://nothingness.asia/journal',
  },
  openGraph: {
    title: 'Editorial Journal | Nothingness',
    description: 'Essays on AI SEO, Generative Search Optimization, Architectural Brutalism, and Alternate Luxury Hospitality in India.',
    url: 'https://nothingness.asia/journal',
    siteName: 'Nothingness',
    images: [
      {
        url: '/images/The Void (1).png',
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
    description: 'Essays on AI SEO, Generative Search Optimization, Architectural Brutalism, and Alternate Luxury Hospitality in India.',
    images: ['/images/The Void (1).png'],
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
          <span>India Targeted Research &amp; Cultural Essays</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.08]">
              The Editorial <span className="italic text-accent-gold">Journal</span>.
            </h1>
            <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mt-3 leading-relaxed font-sans">
              Strategic blueprints on Generative Engine Optimization (GEO), acoustic engineering, brutalist spatial design, and the economics of autonomous hospitality across Indian metros.
            </p>
          </div>

          <div className="hidden lg:block text-right">
            <p className="text-xs font-mono uppercase tracking-widest text-accent-gold">Verified Research</p>
            <p className="font-serif text-2xl text-white font-bold mt-0.5">20 Published Works</p>
            <p className="text-[10px] text-white/40 font-mono mt-1">Delhi NCR • Goa • Bangalore</p>
          </div>
        </div>
      </div>

      {/* Interactive Journal Client */}
      <JournalClient initialArticles={articles} />
    </main>
  );
}
