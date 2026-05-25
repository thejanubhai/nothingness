import { notFound } from "next/navigation";
import Image from "next/image";
import SinglePropertyClient from "./SinglePropertyClient";
import { createClient } from "@/lib/supabase/server";
import { mockPropertyDetails } from "@/lib/mock-data";

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
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  // Try to use DB property, fallback to mock, or 404
  let displayProp: any = null;
  
  if (property) {
    displayProp = {
      title: property.title,
      location: `${property.area}, ${property.city}`,
      description: property.description,
      price: property.nightly_price,
      image: property.featured_image || property.images?.[0] || "/images/property-1.png",
      amenities: property.amenities || [],
      rules: property.rules ? property.rules.split('\n') : []
    };
  } else {
    displayProp = mockPropertyDetails[slug as keyof typeof mockPropertyDetails];
  }

  if (!displayProp) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative w-full h-[70vh] md:h-[85vh]">
        <Image 
          src={displayProp.image}
          alt={displayProp.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-32 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="font-serif text-5xl md:text-7xl mb-4">{displayProp.title}</h1>
            <p className="text-accent-muted uppercase tracking-widest text-sm mb-12 flex items-center">
              <span className="w-8 h-[1px] bg-accent-muted mr-4"></span>
              {displayProp.location}
            </p>

            <div className="prose prose-invert max-w-none mb-16">
              <p className="text-xl md:text-2xl font-light leading-relaxed text-foreground/80 font-sans">
                {displayProp.description}
              </p>
            </div>

            <hr className="border-border-subtle mb-12" />

            <div className="mb-12">
              <h3 className="font-serif text-3xl text-accent-gold mb-8">Atmosphere & Amenities</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                {displayProp.amenities.map((item: string, i: number) => (
                  <li key={i} className="flex items-center text-foreground/70 font-light tracking-wide">
                    <span className="w-1.5 h-1.5 bg-accent-muted rounded-full mr-4"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <hr className="border-border-subtle mb-12" />

            <div>
              <h3 className="font-serif text-3xl text-accent-gold mb-8">House Rules</h3>
              <ul className="space-y-4">
                {displayProp.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex items-start text-foreground/70 font-light tracking-wide">
                    <span className="text-accent-gold mr-4">†</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <SinglePropertyClient 
                property={displayProp}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
