import Hero from "@/components/Hero";
import BookingWidget from "@/components/BookingWidget";
import PropertyCard from "@/components/PropertyCard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let properties = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(4);
    properties = data;
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  const displayProperties = properties ? properties.map(p => ({
    id: p.id,
    title: p.title,
    location: `${p.area}, ${p.city}`,
    image: p.featured_image || p.images?.[0] || "/images/property-1.png",
    price: p.nightly_price,
    slug: p.slug
  })) : [];

  return (
    <main className="min-h-screen">
      {/* Hero + Booking Widget */}
      <div className="relative">
        <Hero />
        <BookingWidget properties={displayProperties.map(p => ({ slug: p.slug, title: p.title }))} />
      </div>

      {/* Properties Section */}
      {displayProperties.length > 0 && (
        <section className="py-24 md:py-32 px-5 md:px-8 max-w-7xl mx-auto">
          <div className="mb-16 md:mb-20 text-center max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Our Spaces</p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-5 text-white">
              Nothingness isn't following trends.
              <br className="hidden md:block" />
              It's setting them.
            </h2>
            <p className="text-white/50 text-[15px] leading-relaxed">
              A next-generation hospitality brand founded in Delhi. Discover a hidden world designed for privacy, comfort, and expression.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {displayProperties.map((prop) => (
              <PropertyCard 
                key={prop.id}
                title={prop.title} 
                location={prop.location}
                image={prop.image}
                price={prop.price}
                slug={prop.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Brand Ethos */}
      <section className="py-24 md:py-32 px-5 md:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            {
              title: "Privacy & Safety",
              description: "Designed for an absolute sense of safety and freedom—especially for women travelers.",
              icon: "🔒"
            },
            {
              title: "Experience-Driven",
              description: "Not just rooms. Carefully curated environments that create lasting, visceral memories.",
              icon: "✦"
            },
            {
              title: "Female-First Community",
              description: "Built on a powerful foundation of trust and loyalty, organically grown through word-of-mouth.",
              icon: "♡"
            }
          ].map((item, i) => (
            <div key={i} className="text-center md:text-left group">
              <span className="text-2xl mb-5 block opacity-60 group-hover:opacity-100 transition-opacity duration-500">{item.icon}</span>
              <h3 className="text-lg font-medium text-white mb-3 tracking-wide">{item.title}</h3>
              <p className="text-white/45 text-[14px] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-5 md:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Community</p>
          <h2 className="font-serif text-4xl mb-3 text-white">Loved by the Community</h2>
          <p className="text-white/40 text-[14px]">Consistently rated 5.0 stars on Airbnb.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { text: "This place is on another level! The vibe, the aesthetics, the privacy – everything was just perfect. Felt so safe and comfortable. Can't wait to visit again!", name: "Riya" },
            { text: "Honestly exceeded all expectations. The room was stunning, super clean and the whole experience was so unique and memorable. Totally worth it!", name: "Aarav" },
            { text: "If you're looking for something different, this is it. Super private, super aesthetic and the host is amazing. We had a fantastic time!", name: "Karan" },
          ].map((review, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-sm border border-white/5 p-7 rounded-2xl hover:border-white/10 transition-colors duration-500">
              <div className="flex items-center gap-1 mb-5 text-accent-gold text-sm tracking-wider">★★★★★</div>
              <p className="text-white/70 text-[14px] leading-relaxed mb-6">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-semibold text-white/60">{review.name[0]}</div>
                <span className="text-[12px] font-medium text-white/50 tracking-wider uppercase">{review.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
