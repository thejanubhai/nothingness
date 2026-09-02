'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, MapPin, Clock, Loader2 } from 'lucide-react';
import Magnetic from '@/components/Magnetic';

export default function SuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const [loading, setLoading] = useState(true);
  const [allVerified, setAllVerified] = useState(false);
  const [guests, setGuests] = useState<any[]>([]);

  useEffect(() => {
    fetchGuests();
    const interval = setInterval(fetchGuests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`/api/guests?bookingId=${resolvedParams.id}`);
      const data = await res.json();
      if (data.guests) {
        setGuests(data.guests);
        const verified = data.guests.length > 0 && data.guests.every((g: any) => g.verification_status === 'verified');
        setAllVerified(verified);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pinSeed = resolvedParams.id.split('-')[0] || '1234';
  const accessPin = parseInt(pinSeed, 16).toString().slice(0, 4).padEnd(4, '0');

  if (loading) {
    return (
      <main className="min-h-screen pt-40 pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
      </main>
    );
  }

  if (!allVerified) {
    const verifiedCount = guests.filter(g => g.verification_status === 'verified').length;
    return (
      <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-3xl mx-auto flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-accent-gold/10 rounded-full flex items-center justify-center mb-8 border border-accent-gold/20">
          <Loader2 className="w-10 h-10 text-accent-gold animate-spin" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mb-4 leading-tight">
          Awaiting <span className="italic text-white/50">Co-Guests</span>
        </h1>
        <p className="text-white/60 mb-8 max-w-md leading-relaxed">
          {verifiedCount} of {guests.length} guests verified. Your access code will be revealed once all guests have uploaded their ID.
        </p>
        <Link 
          href={`/booking/${resolvedParams.id}/verify`}
          className="bg-accent-gold text-black px-8 py-4 rounded-xl text-[12px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-colors"
        >
          Return to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-3xl mx-auto flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-accent-gold/10 rounded-full flex items-center justify-center mb-8 border border-accent-gold/20">
          <ShieldCheck className="w-10 h-10 text-accent-gold" />
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl mb-4 leading-tight">
          Your Sanctuary <br /> <span className="italic text-white/50">Awaits</span>
        </h1>
        
        <p className="text-white/60 mb-12 max-w-lg leading-relaxed">
          Identity verified successfully. Your booking is confirmed. 
          Please save your access credentials below.
        </p>

        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <KeyRound className="w-32 h-32" />
          </div>

          <div className="space-y-8 relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Access Code</p>
              <div className="text-5xl md:text-6xl font-mono text-accent-gold tracking-widest">
                {accessPin}
              </div>
              <p className="text-sm text-white/50 mt-2">Active only during your booked dates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/5">
              <div>
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <Clock className="w-4 h-4" />
                  <p className="text-[10px] uppercase tracking-[0.2em]">Check-in</p>
                </div>
                <p className="text-white text-base font-medium">1:00 PM onwards</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <Clock className="w-4 h-4 text-accent-gold" />
                  <p className="text-[10px] uppercase tracking-[0.2em]">Check-out</p>
                </div>
                <p className="text-accent-gold text-base font-medium">Strictly 11:00 AM</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <MapPin className="w-4 h-4" />
                  <p className="text-[10px] uppercase tracking-[0.2em]">Location</p>
                </div>
                <p className="text-white text-base font-medium">Digital Pass &amp; Push Alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-accent-gold text-black px-8 py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors text-center shadow-xl"
          >
            View Stay Pass in Dashboard →
          </Link>
          <Magnetic>
            <Link 
              href="/"
              className="block w-full sm:w-auto bg-white/5 text-white px-8 py-4 rounded-xl text-[12px] font-semibold tracking-[0.15em] uppercase hover:bg-white/10 transition-colors text-center"
            >
              Return Home
            </Link>
          </Magnetic>
        </div>
      </motion.div>
    </main>
  );
}
