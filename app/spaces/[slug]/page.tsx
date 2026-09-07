import { notFound } from "next/navigation";
import Link from "next/link";
import SingleSpaceClient from "./SingleSpaceClient";
import SpaceCarousel from "@/components/SpaceCarousel";
import { createClient } from "@/lib/supabase/server";
import { getOptimizedImageUrl } from "@/lib/cloudinary/client";
import Script from "next/script";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: space } = await supabase
    .from('spaces')
    .select('title, description, featured_image, area, city')
    .eq('slug', slug)
    .single();

  if (!space) return { title: 'Sanctuary Not Found | Nothingness' };

  const title = `${space.title} | Luxury Private Sanctuary in ${space.city || 'Delhi NCR'}`;
  const description = space.description;
  const canonicalUrl = `https://nothingness.asia/spaces/${slug}`;
  const ogImageUrl = getOptimizedImageUrl(space.featured_image || '/images/IMG_9955.jpg', { width: 1200, height: 630, crop: 'fill' });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [ogImageUrl],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    }
  };
}

export default async function SpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let space = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('slug', slug)
      .single();
    space = data;

    if (space) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('space_id', space.id)
        .neq('status', 'cancelled');
        
      const { data: externalBlockedData } = await supabase
        .from('external_blocked_dates')
        .select('start_date, end_date')
        .eq('space_id', space.id);

      const allBlocked = [
        ...(bookingData || []).map(b => ({ check_in: b.check_in, check_out: b.check_out })),
        ...(externalBlockedData || []).map(b => ({ check_in: b.start_date, check_out: b.end_date }))
      ];
      space.bookings = allBlocked;
    }
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  if (!space) {
    notFound();
  }
  
  const displayProp = {
    id: space.id,
    title: space.title,
    location: `${space.area || ''}, ${space.city || ''}`.replace(/^, /, ''),
    description: space.description,
    price: space.nightly_price,
    default_guests: space.default_guests || 2,
    max_guests: space.max_guests || 4,
    max_additional_guests: space.max_additional_guests || 2,
    additional_guest_fee: Number(space.additional_guest_fee) || 0,
    cleaning_fee: Number(space.cleaning_fee) || 0,
    images: space.images && space.images.length > 0 ? space.images : [space.featured_image || "/images/The Void.png"],
    amenities: space.amenities || [],
    rules: space.rules ? space.rules.split('\n') : [],
    bookings: space.bookings || []
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Carousel */}
      <SpaceCarousel images={displayProp.images} title={displayProp.title} />

      <div className="max-w-7xl mx-auto px-5 md:px-8 -mt-24 md:-mt-32 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16">
          
          {/* Main Content */}
          <div className="lg:col-span-2 pt-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 flex items-center">
              <span className="w-6 h-[1px] bg-accent-gold/40 mr-3" />
              {displayProp.location}
            </p>
            <h1 className="font-serif text-5xl md:text-6xl mb-8 text-white leading-[1.05]">{displayProp.title}</h1>

            <div className="mb-12">
              <p className="text-[16px] md:text-[18px] font-light leading-[1.8] text-white/60">
                {displayProp.description}
              </p>
            </div>

            {/* Sanctuary Lifestyle & Discretion Standard */}
            <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-rose-950/20 to-zinc-950 border border-rose-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full">
                  Sanctuary Lifestyle Standard
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  ✦ 100% Discretion Assured
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-serif">
                Designed for Unhurried Intimacy &amp; Freedom
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                Nothingness sanctuaries are engineered from the ground up for total sensory privacy. Whether you are retreating for candlelit soaks, restorative aftercare, or artistic Shibari suspension sessions, your freedom is protected by uncompromising hospitality standards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono mb-6">
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-rose-400 font-bold block mb-1">Discreet Arrival</span>
                  <span className="text-zinc-400 text-[11px]">Private, peaceful entry; zero moral policing, judgment, or awkward questioning.</span>
                </div>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-purple-400 font-bold block mb-1">Acoustic Privacy</span>
                  <span className="text-zinc-400 text-[11px]">Heavy architectural soundproofing &amp; secluded residential entryways.</span>
                </div>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-amber-400 font-bold block mb-1">Lifestyle Circle</span>
                  <span className="text-zinc-400 text-[11px]">Confirmed guests unlock sovereign invitations to secret Noir Soirées.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800 text-xs font-mono">
                <span className="text-zinc-400">Curious about our private lifestyle circle?</span>
                <Link
                  href="/kinksters"
                  className="text-rose-400 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>Explore Kinkster Mode &amp; Member Vault</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <hr className="border-white/5 mb-12" />

            {/* Amenities */}
            <div className="mb-12">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-8">Atmosphere & Amenities</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayProp.amenities.map((item: string, i: number) => (
                  <li key={i} className="flex items-center text-white/55 text-[14px] tracking-wide">
                    <span className="w-1 h-1 bg-accent-gold/60 rounded-full mr-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <hr className="border-white/5 mb-12" />

            {/* House Rules */}
            <div className="mb-8">
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-8">House Rules</h3>
              <ul className="space-y-4">
                {displayProp.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex items-start text-white/55 text-[14px] tracking-wide">
                    <span className="text-accent-gold/50 mr-4 mt-0.5 text-[12px]">✦</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <SingleSpaceClient space={displayProp} />
          </div>
        </div>
      </div>
      
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HotelRoom',
          name: displayProp.title,
          description: displayProp.description,
          image: displayProp.images[0],
          address: {
            '@type': 'PostalAddress',
            addressLocality: space.city,
            addressCountry: 'India'
          },
          amenityFeature: displayProp.amenities.map((amenity: string) => ({
            '@type': 'LocationFeatureSpecification',
            name: amenity,
            value: true
          }))
        })}}
      />
    </main>
  );
}
