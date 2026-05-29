'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import "yet-another-react-lightbox/styles.css";

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });

export default function PropertyCarousel({ images, title }: { images: string[], title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || lightboxOpen) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [images.length, lightboxOpen]);

  const navigate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrentIndex((prev) => {
      if (dir === 1) return (prev + 1) % images.length;
      return (prev - 1 + images.length) % images.length;
    });
  }, [images.length]);

  if (!images || images.length === 0) return null;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60, scale: 1.02 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, scale: 0.98 }),
  };

  return (
    <>
      <div className="relative w-full h-[75dvh] md:h-[90dvh] group overflow-hidden bg-black">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <Image 
              src={images[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              fill
              priority={currentIndex === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Fullscreen hint */}
        <button 
          onClick={() => setLightboxOpen(true)}
          className="absolute top-8 right-8 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/30 pointer-events-none z-[2]" />

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            aria-label="Previous image"
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/8 backdrop-blur-xl border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/15 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(1); }}
            aria-label="Next image"
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/8 backdrop-blur-xl border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/15 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-28 md:bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                className={`rounded-full transition-all duration-500 ${
                  i === currentIndex 
                    ? 'bg-accent-gold w-7 h-1.5' 
                    : 'bg-white/30 w-1.5 h-1.5 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
    
    <Lightbox
      open={lightboxOpen}
      close={() => setLightboxOpen(false)}
      index={currentIndex}
      slides={images.map((src) => ({ src }))}
      styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
    />
    </>
  );
}
