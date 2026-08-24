'use client';

import { useState } from 'react';
import Magnetic from '@/components/Magnetic';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CancelPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleCancel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const bookingRef = formData.get('bookingRef') as string;
    const reason = formData.get('reason') as string;
    const notes = formData.get('notes') as string;

    try {
      // 1. Submit real cancellation request to contact_messages in Supabase
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Guest (${bookingRef})`,
          email: formData.get('email') || 'concierge@nothingness.asia',
          subject: `Cancellation Request: Booking #${bookingRef}`,
          message: `Booking Reference: ${bookingRef}\nReason: ${reason}\nDetails: ${notes || 'None provided'}\nGuest accepted cancellation terms.`
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setSubmitted(true);
      toast.success('Cancellation Request Recorded', {
        description: "Our concierge team has received your ticket and will process any applicable refund."
      });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please contact concierge directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Modify Reservation</p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4 text-white">Cancellation Request</h1>
        <p className="text-white/50 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
          Please review our <Link href="/legal/cancellation" className="text-accent-gold underline underline-offset-4">Cancellation Policy</Link> before proceeding.
        </p>
      </div>

      {!submitted ? (
        <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-10 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
          <form onSubmit={handleCancel} className="relative z-10 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="bookingRef" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Booking Reference ID / UUID</label>
              <input 
                id="bookingRef"
                name="bookingRef"
                required
                type="text" 
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors uppercase font-mono"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Contact Email</label>
              <input 
                id="email"
                name="email"
                required
                type="email" 
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors font-mono"
                placeholder="your-email@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Reason for Cancellation</label>
              <select 
                id="reason"
                name="reason"
                required
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
              >
                <option className="bg-black" value="">Select a reason...</option>
                <option className="bg-black" value="Change of Schedule">Change of Schedule</option>
                <option className="bg-black" value="Medical Emergency">Medical Emergency</option>
                <option className="bg-black" value="Travel Delay">Travel Delay</option>
                <option className="bg-black" value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">Additional Notes (Optional)</label>
              <textarea 
                id="notes"
                name="notes"
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors resize-none"
                placeholder="Any details to assist our concierge..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" required className="mt-1 accent-accent-gold" />
                <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                  I understand that refunds are processed strictly according to Nothingness Cancellation Guidelines and applicable timeframes.
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-red-900/50 hover:bg-red-800/80 text-red-100 border border-red-500/40 py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 shadow-xl"
              >
                {loading ? "Processing via Supabase..." : "Submit Cancellation Ticket"}
              </button>
              <p className="text-center text-[10px] text-white/30 mt-3 uppercase tracking-widest font-mono">
                Log into Guest Portal to manage confirmed bookings directly
              </p>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 p-8 md:p-12 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl text-white">Cancellation Ticket Submitted</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Your request has been logged into the Nothingness database. Our concierge team is reviewing it and will notify you shortly.
          </p>
          <Link href="/dashboard" className="inline-block mt-4 px-6 py-3 bg-accent-gold text-black font-bold text-xs uppercase rounded-xl">
            Go to Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
