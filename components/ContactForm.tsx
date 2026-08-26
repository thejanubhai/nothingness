'use client';

import React, { useState } from 'react';
import Magnetic from '@/components/Magnetic';
import { toast } from 'sonner';

export default function ContactForm() {
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
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors font-sans"
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
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors font-sans"
            placeholder="name@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="subject" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Inquiry Type</label>
          <select 
            id="subject"
            name="subject"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer font-sans"
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
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors resize-none font-sans"
            placeholder="How can we assist you?"
          />
        </div>

        <div className="pt-2">
          <Magnetic>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 shadow-lg font-mono"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </Magnetic>
        </div>
      </form>
    </div>
  );
}
