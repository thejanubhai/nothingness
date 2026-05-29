'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Magnetic from '@/components/Magnetic';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CancelPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate Cancellation API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Cancellation Request Submitted', {
      description: "Our concierge team will review your request and process any applicable refunds according to our policy."
    });
    
    setLoading(false);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Modify Reservation</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6">Cancellation Request</h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Please review our <a href="/legal/cancellation" className="text-accent-gold underline underline-offset-4">Cancellation Policy</a> before proceeding. Refunds are strictly bound by the timeframe of your request.
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden">
        <form onSubmit={handleCancel} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label htmlFor="bookingRef" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Booking Reference ID</label>
            <input 
              id="bookingRef"
              required
              type="text" 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors uppercase"
              placeholder="e.g. NTH-8492X"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="reason" className="text-[11px] uppercase tracking-[0.2em] text-white/50 ml-1">Reason for Cancellation</label>
            <select 
              id="reason"
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
            >
              <option className="bg-black" value="">Select a reason...</option>
              <option className="bg-black" value="schedule">Change of Schedule</option>
              <option className="bg-black" value="medical">Medical Emergency</option>
              <option className="bg-black" value="travel">Travel Issues</option>
              <option className="bg-black" value="other">Other</option>
            </select>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <label className="flex items-start gap-4 cursor-pointer group">
              <input type="checkbox" required className="mt-1 accent-accent-gold" />
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                I understand that submitting this request does not guarantee a full refund, and that refunds are processed strictly according to the Cancellation Policy.
              </span>
            </label>
          </div>

          <div className="pt-8">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-red-900/40 text-red-100 border border-red-500/30 py-4 rounded-xl text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-red-800/60 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Cancellation Request"}
            </button>
            <p className="text-center text-[11px] text-white/30 mt-4 uppercase tracking-widest">This action cannot be undone</p>
          </div>
        </form>
      </div>
    </main>
  );
}
