'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-[90vh] overflow-hidden bg-black flex flex-col justify-center items-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.png"
          alt="Cinematic background"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 text-center px-4"
      >
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6">
          Not a stay. <br className="hidden md:block"/> A state of mind.
        </h1>
        <p className="font-sans text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 tracking-wide">
          Built for people who never belonged anywhere. Privacy. Atmosphere. Escape.
        </p>
      </motion.div>
    </section>
  );
}
