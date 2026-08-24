'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/Magnetic';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, Users, ShieldCheck, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';

export default function SingleSpaceClient({ space }: { space: any }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const nights = useMemo(() => {
    if (date?.from && date?.to) {
      return differenceInDays(date.to, date.from);
    }
    return 0;
  }, [date]);

  const handleCheckout = async () => {
    if (!date?.from || !date?.to) {
      toast.error('Please select check-in and check-out dates.');
      return;
    }
    setLoading(true);
    try {
      const baseAmount = (space.price * nights) + 2500;
      const extraGuestAmount = guests > 2 ? (guests - 2) * 500 * nights : 0;
      
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: space.id,
          checkIn: date.from.toISOString(),
          checkOut: date.to.toISOString(),
          guests: guests,
          amount: baseAmount + extraGuestAmount
        }),
      });
      const data = await res.json();
      
      if (res.status === 401) {
        toast.error('You must log in to reserve a sanctuary.');
        window.location.href = '/auth';
        return;
      }
      
      if (!res.ok) throw new Error(data.error);

      // Open Cashfree Checkout Modal
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox'
      });
      
      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self"
      };
      
      toast.info('Initializing secure payment...');
      cashfree.checkout(checkoutOptions);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const bookingFormContent = (
    <div className="space-y-5">
      {/* Price Header */}
      <div className="flex items-baseline justify-between pb-5 border-b border-white/5">
        <div>
          <span className="font-serif text-3xl text-white">₹{space.price?.toLocaleString('en-IN')}</span>
          <span className="text-white/40 text-xs ml-2 tracking-wider">/night</span>
        </div>
        <div className="flex items-center gap-1 text-accent-gold text-xs font-mono">
          ★ <span className="text-white/70">5.0 (6x Superhost)</span>
        </div>
      </div>

      {/* Date & Guest Inputs */}
      <div className="space-y-4 relative">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-mono">
            Check-In / Check-Out
          </label>
          <div 
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm px-4 py-3.5 cursor-pointer transition-colors duration-300 hover:border-accent-gold/50 flex justify-between items-center"
          >
            <span className={date?.from ? "text-white font-mono text-xs sm:text-sm" : "text-white/30 text-xs sm:text-sm"}>
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                "Select stay dates..."
              )}
            </span>
            <Calendar className="w-4 h-4 text-accent-gold/70 shrink-0" />
          </div>
          
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 top-[76px] left-0 right-0 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl overflow-x-auto"
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                  <span className="text-xs font-mono text-zinc-400">Select Dates</span>
                  <button onClick={() => setShowCalendar(false)} className="text-zinc-500 hover:text-white text-xs">Close ✕</button>
                </div>
                <DayPicker
                  mode="range"
                  defaultMonth={new Date()}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d?.from && d?.to) {
                      setShowCalendar(false);
                    }
                  }}
                  disabled={[
                    { before: new Date() },
                    ...(space.bookings || []).map((b: any) => ({
                      from: new Date(b.check_in),
                      to: new Date(b.check_out)
                    }))
                  ]}
                  numberOfMonths={1}
                  className="rdp-dark max-w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-mono">Number of Guests</label>
          <div className="relative">
            <select 
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl text-white text-base md:text-sm px-4 py-3.5 focus:outline-none focus:border-accent-gold/50 appearance-none cursor-pointer transition-colors duration-300"
            >
              <option value={1} className="bg-black text-white">1 Guest</option>
              <option value={2} className="bg-black text-white">2 Guests (Standard)</option>
              <option value={3} className="bg-black text-white">3 Guests (+₹500/night)</option>
              <option value={4} className="bg-black text-white">4 Guests (+₹1000/night)</option>
            </select>
            <Users className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 text-xs font-mono border-t border-white/5 pt-4">
        {nights > 0 ? (
          <>
            <div className="flex justify-between text-white/50">
              <span>₹{space.price?.toLocaleString('en-IN')} × {nights} nights</span>
              <span>₹{(space.price * nights)?.toLocaleString('en-IN')}</span>
            </div>
            {guests > 2 && (
              <div className="flex justify-between text-white/50">
                <span>Extra Guests ({guests - 2})</span>
                <span>₹{((guests - 2) * 500 * nights)?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-white/50">
              <span>Cleaning &amp; Sanitation</span>
              <span>₹2,500</span>
            </div>
            <div className="flex justify-between text-white font-medium text-sm pt-2 border-t border-white/10">
              <span>Estimated Total</span>
              <span className="text-accent-gold font-bold font-mono">
                ₹{((space.price * nights) + 2500 + (guests > 2 ? (guests - 2) * 500 * nights : 0))?.toLocaleString('en-IN')}
              </span>
            </div>
          </>
        ) : (
          <div className="text-white/40 text-center py-2 text-xs font-sans">Select dates to calculate total tariff</div>
        )}
      </div>

      {/* CTA Button */}
      <Magnetic>
        <button 
          onClick={handleCheckout}
          disabled={loading || nights === 0}
          className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
        >
          {loading ? "Initializing..." : nights === 0 ? "Select Dates to Book" : `Reserve (${nights} Nights)`}
        </button>
      </Magnetic>

      <p className="text-center text-white/30 text-[10px] tracking-wider font-mono">
        Strict Discretion • Keyless Lockbox Check-in
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Container */}
      <div ref={widgetRef} className="sticky top-28 hidden lg:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-7 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        >
          {bookingFormContent}
        </motion.div>
      </div>

      {/* Mobile Sticky Bottom Floating Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800 px-5 py-3.5 pb-[calc(0.9rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between">
        <div>
          <span className="text-lg font-bold font-mono text-white">₹{space.price?.toLocaleString('en-IN')}</span>
          <span className="text-xs text-zinc-400 ml-1">/ night</span>
          <p className="text-[10px] text-zinc-400 font-mono">
            {nights > 0 ? `${nights} nights selected` : 'Select dates'}
          </p>
        </div>

        <button
          onClick={() => setShowMobileSheet(true)}
          className="px-6 py-3 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all"
        >
          {nights > 0 ? "Continue Booking" : "Reserve Now"}
        </button>
      </div>

      {/* Mobile Booking Sheet Drawer */}
      <AnimatePresence>
        {showMobileSheet && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase font-mono tracking-widest text-accent-gold">Reserve Sanctuary</span>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingFormContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
