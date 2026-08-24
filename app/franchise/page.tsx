'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function FranchisePage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const res = await fetch('/api/franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          location: formData.get('location'),
          budget: formData.get('budget'),
          experience: formData.get('experience')
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Application Received', {
        description: "Our partnership team will review your details and send a prospectus."
      });
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16 sm:mb-20">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Partnerships</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl mb-6 sm:mb-8 leading-tight">
          Invest in the <br /> <span className="italic text-white/50">Sanctuary</span> Network.
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Nothingness is expanding across major metropolitan hubs. We partner with property owners and visionary hosts to build high-yield, discreet luxury hospitality.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 mb-20 sm:mb-32">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10 hover:border-accent-gold/20 transition-colors shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-serif mb-2 text-accent-gold">200%</h2>
          <h3 className="text-lg sm:text-xl mb-3 font-medium text-white">Higher Yields</h3>
          <p className="text-white/60 leading-relaxed text-xs sm:text-sm">
            Our specialized market positioning and premium pricing strategy result in significantly higher RevPAR (Revenue Per Available Room) compared to standard luxury short-term rentals.
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10 hover:border-accent-gold/20 transition-colors shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-serif mb-2 text-accent-gold">94%</h2>
          <h3 className="text-lg sm:text-xl mb-3 font-medium text-white">Occupancy Rate</h3>
          <p className="text-white/60 leading-relaxed text-xs sm:text-sm">
            With organic brand authority and a verified waitlisted community, our flagship sanctuaries operate at near-maximum capacity year-round.
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden max-w-3xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-2 relative z-10 text-center text-white">Request Prospectus</h2>
        <p className="text-white/50 mb-8 max-w-lg mx-auto relative z-10 text-xs sm:text-sm text-center">
          Discreet partnership inquiries. Provide your details below.
        </p>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Full Name</label>
              <input id="name" name="name" required type="text" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Email</label>
              <input id="email" name="email" required type="email" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Phone</label>
              <input id="phone" name="phone" type="tel" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Property Location</label>
              <input id="location" name="location" required type="text" placeholder="e.g. South Delhi, Gurgaon" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="budget" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Investment Capacity</label>
            <select id="budget" name="budget" required className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 appearance-none">
              <option value="Under ₹50 Lakhs" className="bg-black text-white">Under ₹50 Lakhs</option>
              <option value="₹50 Lakhs - ₹1 Crore" className="bg-black text-white">₹50 Lakhs - ₹1 Crore</option>
              <option value="₹1 Crore - ₹5 Crores" className="bg-black text-white">₹1 Crore - ₹5 Crores</option>
              <option value="Above ₹5 Crores" className="bg-black text-white">Above ₹5 Crores</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="experience" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Relevant Experience</label>
            <textarea id="experience" name="experience" rows={3} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 resize-none" placeholder="Experience in hospitality, luxury real estate, or business operations..." />
          </div>
          <div className="pt-2 text-center">
            <button type="submit" disabled={loading} className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 shadow-xl">
              {loading ? "Submitting..." : "Apply for Partnership"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
