import { notFound } from "next/navigation";
import SingleSpaceClient from "./SingleSpaceClient";
import SpaceCarousel from "@/components/SpaceCarousel";
import { createClient } from "@/lib/supabase/server";
import Script from "next/script";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: space } = await supabase
    .from('spaces')
    .select('title, description, featured_image')
    .eq('slug', slug)
    .single();

  if (!space) return { title: 'Not Found' };

  return {
    title: space.title,
    description: space.description,
    openGraph: {
      images: [space.featured_image || '/og-default.png']
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
        .eq('status', 'confirmed');
        
      if (bookingData) {
        space.bookings = bookingData;
      }
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
    images: space.images && space.images.length > 0 ? space.images : [space.featured_image || "/images/property-1.png"],
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

            <div className="mb-16">
              <p className="text-[16px] md:text-[18px] font-light leading-[1.8] text-white/60">
                {displayProp.description}
              </p>
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
