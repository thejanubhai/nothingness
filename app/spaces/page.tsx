import Link from "next/link";
import SpaceCard from "@/components/SpaceCard";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from 'next';
import JsonLd, { generateBreadcrumbSchema, generateSpaceListSchema } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Sanctuaries & Private Suites in Delhi NCR | Nothingness",
  description: "Curated architectural sanctuaries and intimate suites in Delhi NCR. Autonomous keyless entry, acoustic soundproofing, sensory soaking baths, and 100% discretion.",
  keywords: [
    "private sanctuary suites delhi",
    "architectural suite delhi ncr",
    "south delhi intimate stay",
    "soundproof couple retreat delhi",
    "autonomous check in suite delhi",
    "sensory soaking bath suite",
    "discreet luxury staycation delhi ncr",
    "nothingness spaces"
  ],
  alternates: {
    canonical: 'https://nothingness.asia/spaces',
  },
  openGraph: {
    title: "Sanctuaries & Private Suites in Delhi NCR | Nothingness",
    description: "Browse private brutalist sanctuaries, architectural suites, and sensory soaking spaces for total isolation and intimacy across Delhi NCR.",
    url: "https://nothingness.asia/spaces",
    siteName: "Nothingness",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/IMG_9955.jpg",
        width: 1200,
        height: 630,
        alt: "Nothingness Private Sanctuaries & Suites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanctuaries & Private Suites in Delhi NCR | Nothingness",
    description: "Browse private brutalist sanctuaries, architectural suites, and sensory soaking spaces for total isolation and intimacy across Delhi NCR.",
    images: ["/images/IMG_9955.jpg"],
  },
};

export default async function SpacesPage() {
  let spaces: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (data) spaces = data;
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  const displaySpaces = spaces.map((p: any) => ({
    id: p.id,
    title: p.title,
    location: `${p.area || ''}, ${p.city || ''}`.replace(/^, /, '') || 'Delhi NCR',
    image: p.featured_image || p.images?.[0] || "",
    price: p.nightly_price || 0,
    slug: p.slug
  }));

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Spaces', url: '/spaces' },
  ];

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="spaces-breadcrumb-schema" />
      <JsonLd data={generateSpaceListSchema(displaySpaces)} id="spaces-list-schema" />
      <div className="mb-16 border-b border-border-subtle pb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-7xl mb-4">Sanctuaries</h1>
          <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide">
            Curated spaces for total isolation, aesthetics, and intimacy.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-mono text-accent-gold hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Concierge Inquiries</span>
        </Link>
      </div>

      {displaySpaces.length === 0 ? (
        <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-4">
          <p className="text-white/60 text-sm">Sanctuary availability refreshes regularly.</p>
          <Link
            href="/contact"
            className="inline-block bg-accent-gold text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            Inquire with Concierge
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {displaySpaces.map((prop) => (
            <SpaceCard 
              key={prop.id}
              title={prop.title}
              location={prop.location}
              price={prop.price}
              image={prop.image}
              slug={prop.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
