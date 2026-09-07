'use client';

import { useState } from 'react';
import { Calendar, Users, Building2, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/haptics';

interface BookingWidgetProps {
  spaces?: any[];
  initialSlug?: string;
  floating?: boolean;
  className?: string;
  onComplete?: () => void;
}

export default function BookingWidget({
  spaces = [],
  initialSlug,
  floating = false,
  className = '',
  onComplete,
}: BookingWidgetProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialSlug || spaces[0]?.slug || '');
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const selectedTitle = spaces.find((p) => p.slug === selected)?.title || 'Select Sanctuary';

  const handleCheck = () => {
    triggerHaptic('medium');
    if (selected) {
      const params = new URLSearchParams();
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);
      if (guests) params.append('guests', guests);

      const queryString = params.toString();
      const targetUrl = `/spaces/${selected}${queryString ? `?${queryString}` : ''}`;
      
      if (onComplete) onComplete();
      router.push(targetUrl);
    }
  };

  const containerClasses = floating
    ? `absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-4xl ${className}`
    : `w-full ${className}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={containerClasses}
    >
      <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-[0_12px_50px_rgba(0,0,0,0.6)] flex flex-col gap-4">
        
        {/* Grid for Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Property Selector */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
            <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 font-mono flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-accent-gold" /> Sanctuary
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select Sanctuary"
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between text-white text-sm font-medium tracking-wide py-0.5 hover:text-accent-gold transition-colors text-left"
              >
                <span className="truncate">{selectedTitle}</span>
                <ChevronDown
                  className={`w-4 h-4 text-white/40 transition-transform duration-200 shrink-0 ml-1 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && spaces.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl max-h-56 overflow-y-auto"
                  >
                    {spaces.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setSelected(p.slug);
                          setIsOpen(false);
                          triggerHaptic('light');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                          p.slug === selected
                            ? 'text-accent-gold bg-accent-gold/10 font-bold'
                            : 'text-zinc-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{p.title}</span>
                        {p.slug === selected && <Check className="w-3.5 h-3.5 text-accent-gold shrink-0 ml-2" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dates Selection */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
            <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 font-mono flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-accent-gold" /> Dates
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                aria-label="Check-in date"
                className="w-1/2 bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
              />
              <span className="text-zinc-600 text-xs font-mono">→</span>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                aria-label="Check-out date"
                className="w-1/2 bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Guests Selection */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
            <label className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 font-mono flex items-center gap-1.5">
              <Users className="w-3 h-3 text-accent-gold" /> Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              aria-label="Select guest count"
              className="w-full bg-transparent text-white text-xs font-medium focus:outline-none appearance-none cursor-pointer"
            >
              <option value="1" className="bg-zinc-950 text-white">1 Private Guest</option>
              <option value="2" className="bg-zinc-950 text-white">2 Guests (Couple / Pair)</option>
              <option value="3" className="bg-zinc-950 text-white">3 Guests (Private Salon)</option>
              <option value="4" className="bg-zinc-950 text-white">4+ Guests (Intimate Gathering)</option>
            </select>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleCheck}
          className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black py-3.5 px-6 rounded-xl font-bold text-xs tracking-[0.15em] uppercase transition-all duration-200 shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <span>Check Availability &amp; Reserve</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
