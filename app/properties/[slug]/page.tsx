import { notFound } from "next/navigation";
import SinglePropertyClient from "./SinglePropertyClient";
import PropertyCarousel from "@/components/PropertyCarousel";
import { createClient } from "@/lib/supabase/server";

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let property = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('slug', slug)
      .single();
    property = data;

    if (property) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('property_id', property.id)
        .eq('status', 'confirmed');
        
      if (bookingData) {
        property.bookings = bookingData;
      }
    }
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  if (!property) {
    notFound();
  }
  
  const displayProp = {
    title: property.title,
    location: `${property.area}, ${property.city}`,
    description: property.description,
    price: property.nightly_price,
    images: property.images && property.images.length > 0 ? property.images : [property.featured_image || "/images/property-1.png"],
    amenities: property.amenities || [],
    rules: property.rules ? property.rules.split('\n') : [],
    bookings: property.bookings || []
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Carousel */}
      <PropertyCarousel images={displayProp.images} title={displayProp.title} />

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
            <SinglePropertyClient property={displayProp} />
          </div>
        </div>
      </div>
    </main>
  );
}
