import Link from "next/link";
import Image from "next/image";

const posts = [
  {
    title: "The Architecture of Sensual Isolation",
    date: "October 12, 2026",
    excerpt: "Exploring the brutalist concepts that inspired our dark sanctuary rooms, and why heavy, unforgiving materials create the deepest sense of intimacy.",
    image: "/images/IMG_2828.jpeg",
  },
  {
    title: "Curating The Void: Cinema & Atmosphere",
    date: "September 04, 2026",
    excerpt: "A look inside the tactile Italian textures, private cinema setup, and ambient backlit fixtures that give The Void its unforgettable glow.",
    image: "/images/The Void (1).png",
  }
];

export default function JournalPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-5xl md:text-7xl mb-6">Journal</h1>
        <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide max-w-2xl">
          Thoughts on design, alternative culture, and the emotional impact of physical space.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {posts.map((post, i) => (
          <article key={i} className="group cursor-pointer">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-border-subtle mb-6">
              <Image 
                src={post.image} 
                alt={post.title} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
            </div>
            <p className="text-xs uppercase tracking-widest text-accent-muted mb-3">{post.date}</p>
            <h2 className="font-serif text-3xl mb-3 group-hover:text-accent-gold transition-colors">{post.title}</h2>
            <p className="text-foreground/70 font-light leading-relaxed">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
