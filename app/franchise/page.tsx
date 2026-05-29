import { Metadata } from 'next';
import Link from 'next/link';
import Magnetic from '@/components/Magnetic';

export const metadata: Metadata = {
  title: 'Franchise Opportunities | Nothingness',
  description: 'Partner with Nothingness to build luxury, discreet sanctuaries.',
};

export default function FranchisePage() {
  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Partnerships</p>
        <h1 className="font-serif text-5xl md:text-7xl mb-8 leading-tight">
          Invest in the <br /> <span className="italic text-white/50">Underground</span>.
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
          Nothingness is rapidly expanding. We are actively seeking visionary partners and real estate owners to build the next generation of discreet luxury hospitality.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-32">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 hover:border-accent-gold/20 transition-colors">
          <h2 className="text-4xl font-serif mb-4 text-accent-gold">200%</h2>
          <h3 className="text-xl mb-4 font-medium">Higher Yields</h3>
          <p className="text-white/60 leading-relaxed text-sm">
            Our highly specialized market positioning and premium pricing strategy result in significantly higher RevPAR (Revenue Per Available Room) compared to standard luxury rentals.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 hover:border-accent-gold/20 transition-colors">
          <h2 className="text-4xl font-serif mb-4 text-accent-gold">94%</h2>
          <h3 className="text-xl mb-4 font-medium">Occupancy Rate</h3>
          <p className="text-white/60 leading-relaxed text-sm">
            With intense, organic word-of-mouth growth and a highly loyal community, our flagship properties consistently operate at near-maximum capacity year-round.
          </p>
        </div>
      </div>

      <div className="prose prose-invert prose-lg max-w-3xl mx-auto mb-24">
        <h2>What We Provide</h2>
        <ul>
          <li><strong>Architectural & Aesthetic Blueprints:</strong> Complete design guidelines for cinematic lighting, soundproofing, and equipment installation.</li>
          <li><strong>Brand Power:</strong> Instant access to our highly engaged, waitlisted community.</li>
          <li><strong>Tech Stack:</strong> Seamless integration into our custom booking engine, privacy infrastructure, and payment gateways.</li>
          <li><strong>Operational Playbooks:</strong> Rigorous protocols for medical-grade sanitation, guest vetting, and discreet operations.</li>
        </ul>
        
        <h2>Who We Are Looking For</h2>
        <p>We partner with individuals or groups who own premium real estate (apartments, penthouses, or secluded villas) in Tier 1 cities or exclusive getaway destinations. Partners must align with our ethos of absolute discretion, safety, and luxury.</p>
      </div>

      <div className="text-center bg-white/[0.02] border border-white/10 rounded-3xl p-12 relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        <h2 className="font-serif text-3xl md:text-4xl mb-4 relative z-10">Request Prospectus</h2>
        <p className="text-white/50 mb-8 max-w-lg mx-auto relative z-10 text-sm">
          Serious inquiries only. Our partnership team will review your application and send a detailed investment prospectus.
        </p>
        <Magnetic>
          <Link href="/contact" className="relative z-10 inline-block bg-white text-black px-10 py-4 rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold transition-all duration-300">
            Apply Now
          </Link>
        </Magnetic>
      </div>
    </main>
  );
}
