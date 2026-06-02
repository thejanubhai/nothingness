'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '@/components/Magnetic';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import 'react-day-picker/dist/style.css';

export default function SingleSpaceClient({ space }: { space: any }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);

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

      // 2. Open Cashfree Checkout Modal
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
  return (
    <div className="sticky top-28">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white/[0.04] backdrop-blur-2xl border border-white/8 p-7 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
      >
        {/* Price */}
        <div className="flex items-baseline justify-between mb-7 pb-6 border-b border-white/5">
          <div>
            <span className="font-serif text-3xl text-white">₹{space.price?.toLocaleString('en-IN')}</span>
            <span className="text-white/30 text-sm ml-2 tracking-wider">/night</span>
          </div>
          <div className="flex items-center gap-1 text-accent-gold text-[13px]">
            ★ <span className="text-white/60">5.0</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5 mb-7 relative">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Check In - Check Out</label>
            <div 
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl text-white text-[14px] px-4 py-3 cursor-pointer transition-colors duration-300 hover:border-accent-gold/50 flex justify-between items-center"
            >
              <span className={date?.from ? "text-white" : "text-white/20"}>
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  "Select dates"
                )}
              </span>
            </div>
            
            <AnimatePresence>
              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 top-[70px] left-0 right-0 bg-[#0d0d0d] border border-white/10 rounded-xl p-4 shadow-2xl"
                >
                  <DayPicker
                    mode="range"
                    defaultMonth={new Date()}
                    selected={date}
                    onSelect={setDate}
                    disabled={[
                      { before: new Date() },
                      ...(space.bookings || []).map((b: any) => ({
                        from: new Date(b.check_in),
                        to: new Date(b.check_out)
                      }))
                    ]}
                    numberOfMonths={1}
                    className="rdp-dark"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Guests</label>
            <select 
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl text-white text-[14px] px-4 py-3 focus:outline-none focus:border-accent-gold/50 appearance-none cursor-pointer transition-colors duration-300"
            >
              <option value={1} className="bg-black text-white">1 Guest</option>
              <option value={2} className="bg-black text-white">2 Guests</option>
              <option value={3} className="bg-black text-white">3 Guests (+₹500/night)</option>
              <option value={4} className="bg-black text-white">4 Guests (+₹1000/night)</option>
            </select>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 mb-7 text-[13px] border-t border-white/5 pt-6">
          {nights > 0 ? (
            <>
              <div className="flex justify-between text-white/40">
                <span>₹{space.price?.toLocaleString('en-IN')} × {nights} nights</span>
                <span>₹{(space.price * nights)?.toLocaleString('en-IN')}</span>
              </div>
              {guests > 2 && (
                <div className="flex justify-between text-white/40">
                  <span>Extra Guests ({guests - 2})</span>
                  <span>₹{((guests - 2) * 500 * nights)?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-white/40">
                <span>Cleaning fee</span>
                <span>₹2,500</span>
              </div>
              <div className="flex justify-between text-white font-medium pt-3 border-t border-white/5">
                <span>Total</span>
                <span className="text-accent-gold">
                  ₹{((space.price * nights) + 2500 + (guests > 2 ? (guests - 2) * 500 * nights : 0))?.toLocaleString('en-IN')}
                </span>
              </div>
            </>
          ) : (
            <div className="text-white/40 text-center py-2">Select dates to view pricing</div>
          )}
        </div>

        {/* CTA */}
        <Magnetic>
          <button 
            onClick={handleCheckout}
            disabled={loading || nights === 0}
            className="w-full bg-accent-gold text-black py-4 rounded-xl text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Reserve Sanctuary"}
          </button>
        </Magnetic>

        <p className="text-center text-white/20 text-[11px] mt-4 tracking-wide">You won't be charged yet</p>
      </motion.div>
    </div>
  );
}
