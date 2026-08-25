'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Sparkles, Key, Star, CheckCircle2, ShieldCheck, Heart, Building2 } from 'lucide-react';
import Link from 'next/link';
import BookingWidget from '@/components/BookingWidget';

interface Space {
  id: string;
  title: string;
  slug: string;
  tagline?: string;
  description: string;
  price_per_night?: number;
  nightly_price?: number;
  city: string;
  area?: string;
  images: string[];
  featured_image?: string;
  max_guests?: number;
}

export default function PropertySwipeDeck() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBookingWidget, setShowBookingWidget] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/spaces')
      .then(res => res.json())
      .then(data => {
        if (data.spaces && data.spaces.length > 0) {
          setSpaces(data.spaces);
        }
      })
      .catch(err => console.error('Error fetching spaces:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextSpace(); // Swiped left -> next space
      } else {
        handlePrevSpace(); // Swiped right -> prev space
      }
    }
    setTouchStartX(null);
  };

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto h-[480px] bg-zinc-950 border border-zinc-900 rounded-3xl animate-pulse flex items-center justify-center text-zinc-500 text-xs font-mono">
        Loading Luxury Private Sanctuaries...
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto p-12 bg-zinc-950/80 border border-zinc-800 rounded-3xl text-center space-y-4">
        <Building2 className="w-10 h-10 text-rose-400 mx-auto opacity-70" />
        <h3 className="text-lg font-bold text-white font-serif">No Active Sanctuaries Yet</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Add properties directly via the Admin Dashboard to feature them here.
        </p>
        <Link
          href="/admin/spaces/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-gold text-black font-bold text-xs rounded-xl hover:bg-white transition-all shadow-lg"
        >
          <Sparkles className="w-4 h-4" /> Add Sanctuary via Admin
        </Link>
      </div>
    );
  }

  const currentSpace = spaces[currentIndex];
  const rawImages = (currentSpace.images && currentSpace.images.length > 0)
    ? currentSpace.images
    : (currentSpace.featured_image ? [currentSpace.featured_image] : []);
  const spaceImages = rawImages.filter(Boolean);

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {}
  };

  const handleNextSpace = () => {
    triggerHaptic();
    setCurrentIndex((prev) => (prev + 1) % spaces.length);
    setActiveImageIndex(0);
  };

  const handlePrevSpace = () => {
    triggerHaptic();
    setCurrentIndex((prev) => (prev - 1 + spaces.length) % spaces.length);
    setActiveImageIndex(0);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % spaceImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + spaceImages.length) % spaceImages.length);
  };

  return (
    <div className="w-full max-w-xl mx-auto relative px-2">
      
      {/* Swipe Header Indicator */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3 px-2">
        <span className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Swipe to Switch Sanctuaries
        </span>
        <span>{currentIndex + 1} of {spaces.length} Properties</span>
      </div>

      {/* Main Interactive Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[4/5] sm:aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl group transition-transform duration-300 select-none"
      >
        
        {/* Background Image Carousel */}
        <img
          src={spaceImages[activeImageIndex]}
          alt={currentSpace.title}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Dark Vignette Overlay for Crisp Typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono font-bold rounded-full flex items-center gap-1 shadow-lg">
            <MapPin className="w-3 h-3 text-rose-400" /> {currentSpace.city || 'Delhi NCR'}
          </span>

          <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-rose-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold rounded-full flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.98 ★ Private Stay
          </span>
        </div>

        {/* Image Dots Indicator */}
        <div className="absolute top-14 left-4 right-4 flex gap-1 z-10">
          {spaceImages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx === activeImageIndex ? 'bg-white shadow-lg' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Image Tap Navigation Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrevImage} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" onClick={handleNextImage} />

        {/* Bottom Card Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 z-20 space-y-3">
          <div>
            <span className="text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest block mb-1">
              {currentSpace.tagline || 'Cinematic Luxury Sanctuary'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight leading-snug">
              {currentSpace.title}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mt-1 opacity-90">
              {currentSpace.description}
            </p>
          </div>

          {/* Pricing & Key Specs */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Nightly Tariff</span>
              <span className="text-lg font-extrabold text-white font-mono">
                ₹{(currentSpace.nightly_price || currentSpace.price_per_night || 0).toLocaleString('en-IN')}
                <span className="text-xs font-normal text-zinc-400"> / night</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-mono uppercase flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3" /> Keyless Lockbox
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">Max {currentSpace.max_guests || 2} Guests</span>
            </div>
          </div>

          {/* Instant Reserve Button */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/spaces/${currentSpace.slug}`}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-zinc-400" />
              Explore Details
            </Link>

            <button
              onClick={() => setShowBookingWidget(true)}
              className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-1.5"
            >
              <Key className="w-4 h-4" />
              Instant Reserve
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Next / Prev Controls */}
      <div className="flex items-center justify-between mt-4 px-2">
        <button
          onClick={handlePrevSpace}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Sanctuary
        </button>

        <button
          onClick={handleNextSpace}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
        >
          Next Sanctuary <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Instant Booking Widget Modal */}
      {showBookingWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowBookingWidget(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full z-10"
            >
              ✕
            </button>
            <BookingWidget spaces={spaces} />
          </div>
        </div>
      )}
    </div>
  );
}
