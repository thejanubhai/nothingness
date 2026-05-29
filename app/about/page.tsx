import { Metadata } from "next";
import Image from "next/image";
import Magnetic from "@/components/Magnetic";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Nothingness",
  description: "India's First & Only Kink & BDSM Hospitality Brand. Discover the philosophy behind Nothingness.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">The Philosophy</p>
        <h1 className="font-serif text-5xl md:text-7xl mb-8 leading-tight">
          A Sanctuary for the <br /> <span className="italic text-white/50">Unspoken</span>.
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
          Nothingness is India's first and only culturally relevant, community-driven ecosystem dedicated to the kink and BDSM lifestyle. We provide private, aesthetically curated spaces designed for profound exploration.
        </p>
      </div>

      {/* Origin Story */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10">
          <Image 
            src="/images/og-image.jpg" 
            alt="The Atmosphere" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl">The Genesis</h2>
          <p className="text-white/70 leading-relaxed">
            Born out of a necessity for safe, high-end, and judgment-free zones in India, Nothingness was created to bridge the gap between luxury hospitality and underground culture. For too long, the community has had to compromise on quality, safety, or discretion.
          </p>
          <p className="text-white/70 leading-relaxed">
            Our properties are not just rooms; they are immersive experiences. Every texture, every lighting fixture, and every piece of specialized equipment has been meticulously chosen to facilitate intimacy and intense connection.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-32">
        <h2 className="font-serif text-4xl mb-16 text-center">Our Pillars</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Absolute Discretion", desc: "Your privacy is paramount. From secure bookings to nondescript exteriors, we ensure your stay remains entirely your own." },
            { title: "Cinematic Aesthetics", desc: "We believe the environment dictates the experience. Our spaces are designed with cinematic lighting and premium textures." },
            { title: "Uncompromising Safety", desc: "Sanitization protocols that exceed industry standards, coupled with strictly vetted, high-grade specialized equipment." }
          ].map((value, idx) => (
            <div key={idx} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/30 transition-colors">
              <h3 className="font-serif text-xl mb-4 text-accent-gold">{value.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-white/[0.02] border border-white/10 rounded-3xl p-12 md:p-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        <h2 className="font-serif text-3xl md:text-5xl mb-6 relative z-10">Experience the Void</h2>
        <p className="text-white/50 mb-10 max-w-xl mx-auto relative z-10">
          Step into a space where the outside world ceases to exist.
        </p>
        <Magnetic>
          <Link href="/properties/the-chamber" className="relative z-10 inline-block bg-accent-gold text-black px-10 py-4 rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300">
            Book The Chamber
          </Link>
        </Magnetic>
      </div>
    </main>
  );
}
