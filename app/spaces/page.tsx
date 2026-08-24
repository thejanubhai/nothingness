import Link from "next/link";
import SpaceCard from "@/components/SpaceCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function SpacesPage() {
  let spaces: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (data) spaces = data;
  } catch (e) {
    console.error("Supabase connection failed:", e);
  }

  const displaySpaces = spaces.map((p: any) => ({
    id: p.id,
    title: p.title,
    location: `${p.area || ''}, ${p.city || ''}`.replace(/^, /, '') || 'Delhi NCR',
    image: p.featured_image || p.images?.[0] || "/images/The Void.png",
    price: p.nightly_price || 0,
    slug: p.slug
  }));

  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-7xl mb-4">Sanctuaries</h1>
          <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide">
            Curated spaces for total isolation, aesthetics, and intimacy.
          </p>
        </div>
        <Link
          href="/admin/spaces/new"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-mono text-white/60 hover:text-white transition-colors"
        >
          + Add Space
        </Link>
      </div>

      {displaySpaces.length === 0 ? (
        <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-4">
          <p className="text-white/40 text-sm">No active sanctuaries currently listed.</p>
          <Link
            href="/admin/spaces/new"
            className="inline-block bg-accent-gold text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
          >
            Create Space in Admin
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {displaySpaces.map((prop) => (
            <SpaceCard 
              key={prop.id}
              title={prop.title}
              location={prop.location}
              price={prop.price}
              image={prop.image}
              slug={prop.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
