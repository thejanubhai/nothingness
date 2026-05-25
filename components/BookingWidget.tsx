'use client';
import { motion } from 'framer-motion';

export default function BookingWidget() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-5xl"
    >
      <div className="bg-surface-blur backdrop-blur-xl border border-border-subtle rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex-1 w-full lg:w-auto">
          <label className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Location</label>
          <select className="w-full bg-transparent border-b border-border-subtle text-foreground text-lg focus:outline-none focus:border-accent-gold pb-2 appearance-none cursor-pointer">
            <option className="bg-background">The Concrete Villa</option>
            <option className="bg-background">Underground Art Loft</option>
          </select>
        </div>
        <div className="flex-1 w-full lg:w-auto">
          <label className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Check In - Check Out</label>
          <input type="text" placeholder="Select dates" className="w-full bg-transparent border-b border-border-subtle text-foreground text-lg focus:outline-none focus:border-accent-gold pb-2 cursor-pointer" readOnly />
        </div>
        <div className="flex-1 w-full lg:w-auto">
          <label className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Guests</label>
          <select className="w-full bg-transparent border-b border-border-subtle text-foreground text-lg focus:outline-none focus:border-accent-gold pb-2 appearance-none cursor-pointer">
            <option className="bg-background">2 Guests</option>
            <option className="bg-background">1 Guest</option>
            <option className="bg-background">3 Guests</option>
          </select>
        </div>
        <div className="mt-4 lg:mt-0 w-full lg:w-auto">
          <button className="bg-accent-gold text-brown-deep px-10 py-4 rounded-full font-medium tracking-wide hover:bg-accent-muted transition-colors w-full lg:w-auto">
            Check Availability
          </button>
        </div>
      </div>
    </motion.div>
  );
}
