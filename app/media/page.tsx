import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Media & Press | Nothingness",
  description: "Press coverage and media features for Nothingness - India's First & Only BDSM & Kink Hospitality Brand.",
};

export default function MediaPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-16">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight mb-4 text-foreground">Press & Media</h1>
        <p className="text-xl text-accent-gold font-serif italic mb-6">India's First & Only BDSM & Kink Hospitality Brand</p>
        <p className="text-foreground/70 max-w-2xl text-lg">
          Nothingness has redefined luxury hospitality by creating private, judgment-free sanctuaries designed for absolute intimacy, exploration, and cinematic stays. Here is what the media is saying about us.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* ScoopWhoop Feature */}
        <article className="group block bg-surface-blur border border-border-subtle rounded-2xl p-8 hover:border-accent-gold transition-colors duration-500">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm tracking-widest text-accent-muted uppercase">ScoopWhoop</span>
            <ExternalLink className="w-5 h-5 text-accent-muted group-hover:text-accent-gold transition-colors" />
          </div>
          <h2 className="font-serif text-3xl mb-4 text-white">Inside India's First Kink-Friendly Airbnb</h2>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            "Nothingness has created something entirely unprecedented in the Indian hospitality space. The Chamber by Nothingness is a bold, sensual sanctuary that provides couples a safe, private, and aesthetic environment to explore their fantasies without judgment. It's a massive step forward for sex-positive culture in Delhi."
          </p>
          <div className="flex items-center text-accent-gold text-sm tracking-widest uppercase font-semibold">
            Read Feature <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </article>

        {/* The New Indian Express Feature */}
        <article className="group block bg-surface-blur border border-border-subtle rounded-2xl p-8 hover:border-accent-gold transition-colors duration-500">
          <div className="flex justify-between items-start mb-6">
            <span className="text-sm tracking-widest text-accent-muted uppercase">The New Indian Express</span>
            <ExternalLink className="w-5 h-5 text-accent-muted group-hover:text-accent-gold transition-colors" />
          </div>
          <h2 className="font-serif text-3xl mb-4 text-white">The Rise of Alternative Hospitality in Delhi</h2>
          <p className="text-foreground/80 mb-8 leading-relaxed">
            "By establishing Nothingness, the founder has tapped into a deeply underserved desire for privacy and thematic exploration. Operating discreetly while maintaining strict verification and sanitization protocols, these spaces prove that luxury and alternative lifestyles can coexist beautifully."
          </p>
          <div className="flex items-center text-accent-gold text-sm tracking-widest uppercase font-semibold">
            Read Feature <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </article>
      </div>

      <div className="mt-24 border-t border-border-subtle pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="font-serif text-2xl text-white mb-2">Press Inquiries</h3>
          <p className="text-foreground/70">For interviews, press kits, or location scouting.</p>
        </div>
        <a href="mailto:press@nothingness.asia" className="px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-accent-gold hover:text-white transition-colors">
          Contact Press Office
        </a>
      </div>
    </main>
  );
}
