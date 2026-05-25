import Hero from "@/components/Hero";
import BookingWidget from "@/components/BookingWidget";
import PropertyCard from "@/components/PropertyCard";
import { createClient } from "@/lib/supabase/server";
import { mockProperties } from "@/lib/mock-data";

export default async function Home() {
  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(4);

  // Fallback to mock data if no db is connected or no properties exist
  const displayProperties = (properties && properties.length > 0) 
    ? properties.map(p => ({
        id: p.id,
        title: p.title,
        location: `${p.area}, ${p.city}`,
        image: p.featured_image || p.images?.[0] || "/images/property-1.png",
        price: p.nightly_price,
        slug: p.slug
      }))
    : mockProperties.slice(0, 4);

  return (
    <main className="min-h-screen">
      <div className="relative pb-10">
        <Hero />
        <BookingWidget />
      </div>

      <section className="py-32 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="font-serif text-4xl md:text-5xl mb-6">The Experience</h2>
          <p className="text-foreground/70 max-w-2xl text-lg md:text-xl leading-relaxed">
            Discover a hidden world designed for artists, rebels, and visionaries. 
            Every property has a personality, atmosphere, story, mood, and energy. 
            Step out of the ordinary and immerse yourself in the unknown.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
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
    </main>
  );
}
