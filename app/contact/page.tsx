'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 md:gap-24">
        {/* Info Side */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Get in Touch</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-8 leading-[1.1]">
            Speak with the <br /> <span className="text-white/50 italic">Concierge</span>.
          </h1>
          <p className="text-white/60 mb-12 text-lg leading-relaxed max-w-md">
            Whether you are inquiring about a future stay, franchise opportunities, or specific property amenities, our team operates with absolute discretion.
          </p>

          <div className="space-y-8 border-t border-white/10 pt-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">General Inquiries</p>
              <a href="mailto:concierge@nothingness.asia" className="text-lg hover:text-accent-gold transition-colors">concierge@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Franchise & Press</p>
              <a href="mailto:partners@nothingness.asia" className="text-lg hover:text-accent-gold transition-colors">partners@nothingness.asia</a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Emergency (Guests Only)</p>
              <p className="text-lg text-white/60">Provided upon check-in</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-white/[0.02] border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.03),transparent_50%)]" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Name</label>
              <motion.input 
                whileFocus={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                transition={{ duration: 0.2 }}
                id="name"
                name="name"
                required
                type="text" 
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Email</label>
              <motion.input 
                whileFocus={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                transition={{ duration: 0.2 }}
                id="email"
                name="email"
                required
                type="email" 
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Inquiry Type</label>
              <motion.select 
                whileFocus={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                transition={{ duration: 0.2 }}
                id="subject"
                name="subject"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
              >
                <option className="bg-black">Booking Question</option>
                <option className="bg-black">Franchise Inquiry</option>
                <option className="bg-black">Press & Media</option>
                <option className="bg-black">Other</option>
              </motion.select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Message</label>
              <motion.textarea 
                whileFocus={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                transition={{ duration: 0.2 }}
                id="message"
                name="message"
                required
                rows={5}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors resize-none"
                placeholder="How can we assist you?"
              />
            </div>

            <div className="pt-4">
              <Magnetic>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-4 rounded-xl text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-white transition-all duration-300 disabled:opacity-50"
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
