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
  const [guests, setGuests] = useState(space.default_guests || 2);
  const [additionalGuests, setAdditionalGuests] = useState<{ name: string; phone: string }[]>([]);
  const [paymentMode, setPaymentMode] = useState<'primary_pays' | 'split_self_pay'>('primary_pays');
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const defaultGuests = space.default_guests || 2;
  const maxGuests = space.max_guests || 4;
  const additionalGuestFee = space.additional_guest_fee || 500;
  const cleaningFee = space.cleaning_fee || 2500;

  const extraGuestCount = Math.max(0, guests - defaultGuests);

  // Sync additionalGuests array size when guests changes
  const handleGuestsChange = (newGuestsCount: number) => {
    setGuests(newGuestsCount);
    const newExtraCount = Math.max(0, newGuestsCount - defaultGuests);
    
    setAdditionalGuests(prev => {
      const updated = [...prev];
      if (updated.length < newExtraCount) {
        while (updated.length < newExtraCount) {
          updated.push({ name: '', phone: '' });
        }
      } else if (updated.length > newExtraCount) {
        return updated.slice(0, newExtraCount);
      }
      return updated;
    });
  };

  const handleAdditionalGuestUpdate = (index: number, field: 'name' | 'phone', value: string) => {
    setAdditionalGuests(prev => {
      const updated = [...prev];
      if (!updated[index]) updated[index] = { name: '', phone: '' };
      updated[index][field] = value;
      return updated;
    });
  };

  const nights = useMemo(() => {
    if (date?.from && date?.to) {
      return differenceInDays(date.to, date.from);
    }
    return 0;
  }, [date]);

  // Pricing calculations
  const baseStayTotal = (space.price * nights) + cleaningFee;
  const extraGuestTotal = extraGuestCount * additionalGuestFee * nights;
  const perGuestShareWithGst = extraGuestCount > 0 
    ? Math.round((additionalGuestFee * nights) * 1.18) 
    : 0;

  const primaryEstimatedTotal = paymentMode === 'primary_pays'
    ? Math.round((baseStayTotal + extraGuestTotal) * 1.18)
    : Math.round(baseStayTotal * 1.18);

  const handleCheckout = async () => {
    if (!date?.from || !date?.to) {
      toast.error('Please select check-in and check-out dates.');
      return;
    }

    if (extraGuestCount > 0) {
      for (let i = 0; i < extraGuestCount; i++) {
        const g = additionalGuests[i];
        if (!g?.name?.trim()) {
          toast.error(`Please enter Name for Additional Guest ${i + 1}`);
          return;
        }
        if (!g?.phone?.trim() || g.phone.replace(/[^0-9]/g, '').length < 10) {
          toast.error(`Please enter a valid 10-digit WhatsApp number for Additional Guest ${i + 1}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: space.id,
          checkIn: date.from.toISOString(),
          checkOut: date.to.toISOString(),
          guests: guests,
          additionalGuests: additionalGuests,
          additionalGuestPaymentMode: paymentMode,
        }),
      });
      const data = await res.json();
      
      if (res.status === 401) {
        toast.error('You must log in to reserve a sanctuary.');
        window.location.href = '/auth';
        return;
      }
      
      if (!res.ok) throw new Error(data.error);

      // Dynamically create and submit PayU form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;

      Object.entries(data.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      toast.info('Connecting to PayU Secure Payment Gateway...');
      form.submit();
      
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Number of Guests</label>
            <span className="text-[10px] text-accent-gold/70 font-mono">Includes up to {defaultGuests} guests</span>
          </div>
          <div className="relative">
            <select 
              value={guests}
              onChange={(e) => handleGuestsChange(Number(e.target.value))}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl text-white text-base md:text-sm px-4 py-3.5 focus:outline-none focus:border-accent-gold/50 appearance-none cursor-pointer transition-colors duration-300"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => {
                const isIncluded = num <= defaultGuests;
                const extraCount = num - defaultGuests;
                return (
                  <option key={num} value={num} className="bg-black text-white">
                    {num} {num === 1 ? 'Guest' : 'Guests'} {isIncluded ? '(Included in Base Rate)' : `(+₹${(extraCount * additionalGuestFee).toLocaleString('en-IN')}/night for ${extraCount} extra ${extraCount === 1 ? 'guest' : 'guests'})`}
                  </option>
                );
              })}
            </select>
            <Users className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Additional Guest Details & Payment Mode Options */}
        {extraGuestCount > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Additional Guest Verification</span>
              <span className="text-[10px] px-2 py-0.5 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 rounded-full font-mono">
                {extraGuestCount} Extra {extraGuestCount === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed">
              Enter details for each additional guest. They will receive a private WhatsApp/SMS link for ID verification.
            </p>

            {/* Guest Details Form */}
            <div className="space-y-3">
              {Array.from({ length: extraGuestCount }).map((_, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[10px] font-mono text-accent-gold/80 uppercase tracking-widest block">
                    Additional Guest {idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      required
                      type="text"
                      placeholder="Full Name (as per ID)"
                      value={additionalGuests[idx]?.name || ''}
                      onChange={(e) => handleAdditionalGuestUpdate(idx, 'name', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base md:text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent-gold/50"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="WhatsApp Number (10 digits)"
                      value={additionalGuests[idx]?.phone || ''}
                      onChange={(e) => handleAdditionalGuestUpdate(idx, 'phone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base md:text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent-gold/50 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Mode Options (2 Options) */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                Additional Guest Fee Payment Option
              </span>

              <div className="space-y-2">
                {/* Option 1: Primary Pays */}
                <label 
                  onClick={() => setPaymentMode('primary_pays')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMode === 'primary_pays' 
                      ? 'bg-accent-gold/10 border-accent-gold text-white' 
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value="primary_pays"
                    checked={paymentMode === 'primary_pays'}
                    onChange={() => setPaymentMode('primary_pays')}
                    className="mt-0.5 text-accent-gold focus:ring-accent-gold"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Primary Guest Pays Now (Recommended)</span>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      I will pay the extra guest fee (₹{extraGuestTotal?.toLocaleString('en-IN')}) now. Guests only need to upload their Govt ID via the WhatsApp link.
                    </p>
                  </div>
                </label>

                {/* Option 2: Guest Self-Pays */}
                <label 
                  onClick={() => setPaymentMode('split_self_pay')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMode === 'split_self_pay' 
                      ? 'bg-accent-gold/10 border-accent-gold text-white' 
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value="split_self_pay"
                    checked={paymentMode === 'split_self_pay'}
                    onChange={() => setPaymentMode('split_self_pay')}
                    className="mt-0.5 text-accent-gold focus:ring-accent-gold"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">Guests Pay Themselves via Verification Link</span>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Send payment + ID verification link to each guest. Each guest will pay ₹{perGuestShareWithGst?.toLocaleString('en-IN')} directly when uploading their ID.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 text-xs font-mono border-t border-white/5 pt-4">
        {nights > 0 ? (
          <>
            <div className="flex justify-between text-white/50">
              <span>Base Stay ({space.price?.toLocaleString('en-IN')} × {nights} nights)</span>
              <span>₹{(space.price * nights)?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Luxury Sanitization &amp; Cleaning</span>
              <span>₹{cleaningFee?.toLocaleString('en-IN')}</span>
            </div>
            {extraGuestCount > 0 && (
              <div className="flex justify-between text-white/50">
                <span>Extra Guests ({extraGuestCount} × ₹{additionalGuestFee}/nt × {nights} nts)</span>
                <span>
                  {paymentMode === 'primary_pays' 
                    ? `₹${extraGuestTotal?.toLocaleString('en-IN')}` 
                    : `₹${extraGuestTotal?.toLocaleString('en-IN')} (Split Self-Pay)`}
                </span>
              </div>
            )}
            <div className="flex justify-between text-white/50">
              <span>GST &amp; Hospitality Taxes (18%)</span>
              <span>
                ₹{paymentMode === 'primary_pays' 
                  ? Math.round((baseStayTotal + extraGuestTotal) * 0.18)?.toLocaleString('en-IN')
                  : Math.round(baseStayTotal * 0.18)?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-white font-medium text-sm pt-2 border-t border-white/10">
              <span>{paymentMode === 'primary_pays' ? 'Total Payable Now' : 'Primary Payable Now'}</span>
              <span className="text-accent-gold font-bold font-mono">
                ₹{primaryEstimatedTotal?.toLocaleString('en-IN')}
              </span>
            </div>
            {paymentMode === 'split_self_pay' && extraGuestCount > 0 && (
              <p className="text-[10px] text-amber-400/80 pt-1 font-sans">
                * Note: {extraGuestCount} additional {extraGuestCount === 1 ? 'guest' : 'guests'} will pay ₹{perGuestShareWithGst?.toLocaleString('en-IN')} each via their ID verification link.
              </p>
            )}
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
          {loading ? "Initializing..." : nights === 0 ? "Select Dates to Book" : `Reserve (${nights} Nights • ₹${primaryEstimatedTotal?.toLocaleString('en-IN')})`}
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
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-h-[88vh] overflow-y-auto"
            >
              <div className="sheet-drag-pill" />
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
