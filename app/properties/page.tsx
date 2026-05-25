import PropertyCard from "@/components/PropertyCard";

// Mock data fallback for when Supabase is not yet populated
const mockProperties = [
  {
    id: "4",
    title: "The Chamber",
    slug: "the-chamber",
    location: "Secret Location",
    price: 1500,
    image: "/images/the-chamber.jpg", // placeholder for the provided photo
  },
  {
    id: "1",
    title: "The Concrete Villa",
    slug: "concrete-villa",
    location: "Hidden Woods, NY",
    price: 1200,
    image: "/images/property-1.png",
  },
  {
    id: "2",
    title: "Underground Art Loft",
    slug: "underground-loft",
    location: "Berlin, Germany",
    price: 850,
    image: "/images/property-2.png",
  },
  {
    id: "3",
    title: "The Glass House",
    slug: "glass-house",
    location: "Kyoto, Japan",
    price: 1500,
    image: "/images/hero.png",
  }
];

export default async function PropertiesPage() {
  // In a real scenario, we would fetch from Supabase here:
  // const supabase = await createClient();
  // const { data: properties } = await supabase.from('properties').select('*').eq('active', true);
  
  const properties = mockProperties;

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-5xl md:text-7xl mb-6">Our Sanctuaries</h1>
        <p className="text-foreground/70 max-w-2xl text-lg md:text-xl leading-relaxed">
          Curated spaces designed for the senses. From brutalist architecture hidden in forests to underground industrial lofts. Find your state of mind.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
        {properties.map((prop) => (
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
    </main>
  );
}
