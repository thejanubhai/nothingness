import { Metadata } from "next";
import Image from "next/image";
import Magnetic from "@/components/Magnetic";
import Link from "next/link";
import JsonLd, { generateBreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "The Philosophy & Vision | Nothingness Luxury Sanctuaries",
  description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. Discover the architectural philosophy, sensory design, and privacy standards behind Nothingness.",
  keywords: [
    "nothingness philosophy",
    "alternate lifestyle hospitality india",
    "brutalist architecture philosophy",
    "sensory isolation stays",
    "luxury intimacy spaces india"
  ],
  alternates: {
    canonical: 'https://nothingness.asia/about',
  },
  openGraph: {
    title: "The Philosophy & Vision | Nothingness",
    description: "India's Premier Alternate Lifestyle & Luxury Sanctuary Brand. A sanctuary for the unspoken.",
    url: "https://nothingness.asia/about",
    images: ['/images/IMG_4446.jpeg'],
  },
};

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Philosophy', url: '/about' }
  ];

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-5xl mx-auto">
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} id="about-breadcrumb-schema" />
      {/* Hero Section */}
      <div className="text-center mb-16 sm:mb-24">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 sm:mb-4 font-mono">The Philosophy</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl mb-6 sm:mb-8 leading-tight">
          A Sanctuary for the <br /> <span className="italic text-white/50">Unspoken</span>.
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Nothingness is India's premier community-driven ecosystem dedicated to the alternate lifestyle. We provide private, aesthetically curated spaces designed for profound exploration and sensory immersion.
        </p>
      </div>

      {/* Origin Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center mb-20 sm:mb-32">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <Image 
            src="/images/IMG_4446.jpeg" 
            alt="The Atmosphere" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl">The Genesis</h2>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed">
            Born out of a necessity for safe, high-end, and judgment-free zones in India, Nothingness was created to bridge the gap between luxury hospitality and discreet lifestyle culture. For too long, individuals have had to compromise on quality, safety, or discretion.
          </p>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed">
            Our properties are not just rooms; they are immersive experiences. Every texture, every lighting fixture, and every piece of specialized equipment has been meticulously chosen to facilitate intimacy and intense connection.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-20 sm:mb-32">
        <h2 className="font-serif text-3xl sm:text-4xl mb-10 sm:mb-16 text-center">Our Pillars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { title: "Absolute Discretion", desc: "Your privacy is paramount. From secure bookings to nondescript exteriors, we ensure your stay remains entirely your own." },
            { title: "Cinematic Aesthetics", desc: "We believe the environment dictates the experience. Our spaces are designed with cinematic lighting and premium textures." },
            { title: "Uncompromising Safety", desc: "Sanitization protocols that exceed industry standards, coupled with strictly vetted, high-grade specialized equipment." }
          ].map((value, idx) => (
            <div key={idx} className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent-gold/30 transition-colors">
              <h3 className="font-serif text-lg sm:text-xl mb-3 sm:mb-4 text-accent-gold">{value.title}</h3>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-white/[0.02] border border-white/10 rounded-3xl p-8 sm:p-12 md:p-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 relative z-10">Experience the Void</h2>
        <p className="text-white/50 mb-8 sm:mb-10 max-w-xl mx-auto relative z-10 text-sm sm:text-base">
          Step into a space where the outside world ceases to exist.
        </p>
        <Magnetic>
          <Link href="/spaces" className="relative z-10 inline-block bg-accent-gold text-black px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-xs sm:text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 shadow-xl">
            Explore Sanctuaries
          </Link>
        </Magnetic>
      </div>
    </main>
  );
}
