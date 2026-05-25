'use client';

import { motion } from 'framer-motion';

export default function SinglePropertyClient({ property }: { property: any }) {
  return (
    <div className="sticky top-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-blur backdrop-blur-xl border border-border-subtle p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex justify-between items-end mb-8 border-b border-border-subtle pb-6">
          <h3 className="font-serif text-3xl">${property.price}</h3>
          <span className="text-sm text-foreground/50 uppercase tracking-widest">Per Night</span>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Check In - Check Out</label>
            <input type="text" placeholder="Select dates" className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 cursor-pointer" readOnly />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Guests</label>
            <select className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 appearance-none cursor-pointer">
              <option className="bg-background">2 Guests</option>
              <option className="bg-background">1 Guest</option>
              <option className="bg-background">3 Guests</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 mb-8 text-sm text-foreground/70 border-t border-border-subtle pt-6">
          <div className="flex justify-between">
            <span>${property.price} x 3 nights</span>
            <span>${property.price * 3}</span>
          </div>
          <div className="flex justify-between">
            <span>Cleaning fee</span>
            <span>$150</span>
          </div>
          <div className="flex justify-between text-foreground font-medium pt-3 border-t border-border-subtle">
            <span>Total</span>
            <span className="text-accent-gold">${(property.price * 3) + 150}</span>
          </div>
        </div>

        <button className="w-full bg-accent-gold text-brown-deep py-4 rounded-full font-medium tracking-wide hover:bg-accent-muted transition-colors">
          Reserve Sanctuary
        </button>
      </motion.div>
    </div>
  );
}
