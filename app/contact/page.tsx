'use client';

import { useState } from 'react';
import Magnetic from '@/components/Magnetic';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message')
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Message Received', {
        description: "Our concierge team will review your inquiry and respond shortly."
      });
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
        {/* Info Side */}
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Get in Touch</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-6 sm:mb-8 leading-[1.1]">
            Speak with the <br /> <span className="text-white/50 italic">Concierge</span>.
          </h1>
          <p className="text-white/60 mb-8 sm:mb-12 text-base sm:text-lg leading-relaxed max-w-md">
            Whether you are inquiring about a future stay, franchise opportunities, or specific property amenities, our team operates with absolute discretion.
          </p>

          <div className="space-y-6 sm:space-y-8 border-t border-white/10 pt-8 sm:pt-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">General Inquiries</p>
              <a href="mailto:concierge@nothingness.asia" className="text-base sm:text-lg text-white hover:text-accent-gold transition-colors break-all">concierge@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">Franchise &amp; Press</p>
              <a href="mailto:partners@nothingness.asia" className="text-base sm:text-lg text-white hover:text-accent-gold transition-colors break-all">partners@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5 font-mono">Emergency (Guests Only)</p>
              <p className="text-base sm:text-lg text-white/60">Provided upon check-in</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-white/[0.02] border border-white/10 p-6 sm:p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.03),transparent_50%)]" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Name</label>
              <input 
                id="name"
                name="name"
                required
                type="text" 
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                placeholder="Your Name"
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Email</label>
              <input 
                id="email"
                name="email"
                required
                type="email" 
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Inquiry Type</label>
              <select 
                id="subject"
                name="subject"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Booking Question" className="bg-black text-white">Booking Question</option>
                <option value="Franchise Inquiry" className="bg-black text-white">Franchise Inquiry</option>
                <option value="Press & Media" className="bg-black text-white">Press &amp; Media</option>
                <option value="Other" className="bg-black text-white">Other</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Message</label>
              <textarea 
                id="message"
                name="message"
                required
                rows={4}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors resize-none"
                placeholder="How can we assist you?"
              />
            </div>

            <div className="pt-2">
              <Magnetic>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 shadow-lg"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </Magnetic>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
