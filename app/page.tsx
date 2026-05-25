import Hero from "@/components/Hero";
import BookingWidget from "@/components/BookingWidget";
import PropertyCard from "@/components/PropertyCard";

export default function Home() {
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
          <PropertyCard 
            title="The Concrete Villa" 
            location="Hidden Woods, NY"
            image="/images/property-1.png"
            price={1200}
            slug="concrete-villa"
          />
          <PropertyCard 
            title="Underground Art Loft" 
            location="Berlin, Germany"
            image="/images/property-2.png"
            price={850}
            slug="underground-loft"
          />
        </div>
      </section>
    </main>
  );
}
