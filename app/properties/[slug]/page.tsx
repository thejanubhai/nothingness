import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SinglePropertyClient from "./SinglePropertyClient";

// Mock data for UI demonstration
const mockPropertyData = {
  "the-chamber": {
    title: "The Chamber",
    location: "Secret Location",
    description: "An intense, sensual sanctuary bathed in deep red ambient light. The Chamber by Nothingness is designed for absolute intimacy and exploration. Featuring raw, dark walls, heavy chains, a St. Andrew's cross, and premium restraints, this space offers a cinematic, underground experience far removed from the ordinary world. The heavy ornate rugs and tungsten accents contrast with the intense fetish elements, creating an atmosphere of mysterious luxury.",
    price: 1500,
    image: "/images/the-chamber.jpg",
    amenities: ["St. Andrew's Cross", "Premium Restraints", "Ambient Red Lighting", "Soundproofing", "Heavy Chains", "Custom Dark Furniture"],
    rules: ["Absolute Discretion Required", "No photography outside the space", "Respect the equipment"],
  },
  "concrete-villa": {
    title: "The Concrete Villa",
    location: "Hidden Woods, NY",
    description: "A brutalist masterpiece hidden deep within a secluded forest. The Concrete Villa contrasts harsh, angular architecture with the soft, chaotic beauty of nature. Large glass windows blur the line between inside and out. It is a space designed for total isolation and deep reflection.",
    price: 1200,
    image: "/images/property-1.png",
    amenities: ["Private Forest", "Fire Pit", "Minimalist Kitchen", "Tungsten Lighting", "Sound System"],
    rules: ["No parties", "No pets", "Quiet hours after 10PM"],
  },
  "underground-loft": {
    title: "Underground Art Loft",
    location: "Berlin, Germany",
    description: "An industrial space reimagined as an intimate sanctuary for creators. Featuring exposed concrete, muted gold accents, and a curated collection of contemporary art. It feels like an exclusive gallery where you are allowed to sleep.",
    price: 850,
    image: "/images/property-2.png",
    amenities: ["Art Studio Space", "Vinyl Player", "Espresso Machine", "Blackout Curtains", "Curated Library"],
    rules: ["No smoking", "Respect the artwork"],
  },
  "glass-house": {
    title: "The Glass House",
    location: "Kyoto, Japan",
    description: "A transparent pavilion floating above a zen garden. Designed for those who have nothing to hide. It offers an immersive experience of the changing seasons.",
    price: 1500,
    image: "/images/hero.png",
    amenities: ["Zen Garden", "Tea Room", "Heated Floors", "Soaking Tub"],
    rules: ["Remove shoes indoors", "No loud music"],
  }
};

export default async function SinglePropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const property = mockPropertyData[resolvedParams.slug as keyof typeof mockPropertyData];

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="font-serif text-3xl">Sanctuary not found.</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative pb-32">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full p-6 z-50 mix-blend-difference text-white">
        <Link href="/properties" className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity">
          <ArrowLeft size={20} />
          <span className="text-sm uppercase tracking-widest">Back to Properties</span>
        </Link>
      </nav>

      {/* Cinematic Hero */}
      <section className="relative w-full h-screen">
        <Image
          src={property.image}
          alt={property.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-10 left-4 md:left-12 z-10 max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-accent-muted mb-4">{property.location}</p>
          <h1 className="font-serif text-5xl md:text-8xl mb-4">{property.title}</h1>
        </div>
      </section>

      {/* Content & Sticky Booking */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
        
        {/* Left Column: Editorial Content */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="font-serif text-3xl md:text-4xl mb-6 text-accent-gold">The Story</h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-16 font-sans font-light">
              {property.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent-muted mb-6">Amenities</h3>
                <ul className="space-y-4">
                  {property.amenities.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/80 border-b border-border-subtle pb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xs uppercase tracking-widest text-accent-muted mb-6">House Rules</h3>
                <ul className="space-y-4">
                  {property.rules.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/80 border-b border-border-subtle pb-3">
                      <span className="text-accent-gold/50">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="lg:col-span-5 xl:col-span-4 relative">
          <SinglePropertyClient property={property} />
        </div>
      </section>
    </main>
  );
}
