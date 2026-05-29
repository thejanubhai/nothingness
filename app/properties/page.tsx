import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  let properties = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
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
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-5xl md:text-7xl mb-6">Sanctuaries</h1>
        <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide">
          Curated spaces for total isolation and immersion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {displayProperties.map((prop) => (
          <PropertyCard 
            key={prop.id}
            title={prop.title}
            location={prop.location}
            price={prop.price}
            image={prop.image}
            slug={prop.slug}
          />
        ))}
      </div>
    </main>
  );
}
