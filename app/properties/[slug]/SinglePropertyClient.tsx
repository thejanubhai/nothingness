'use client';

import { motion } from 'framer-motion';

export default function SinglePropertyClient({ property }: { property: any }) {
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
            <span className="font-serif text-3xl text-white">₹{property.price?.toLocaleString('en-IN')}</span>
            <span className="text-white/30 text-sm ml-2 tracking-wider">/night</span>
          </div>
          <div className="flex items-center gap-1 text-accent-gold text-[13px]">
            ★ <span className="text-white/60">5.0</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5 mb-7">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Check In - Check Out</label>
            <input 
              type="text" 
              placeholder="Select dates" 
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl text-white text-[14px] px-4 py-3 focus:outline-none focus:border-accent-gold/50 placeholder:text-white/20 cursor-pointer transition-colors duration-300" 
              readOnly 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Guests</label>
            <select className="w-full bg-white/[0.04] border border-white/8 rounded-xl text-white text-[14px] px-4 py-3 focus:outline-none focus:border-accent-gold/50 appearance-none cursor-pointer transition-colors duration-300">
              <option className="bg-black text-white">2 Guests</option>
              <option className="bg-black text-white">1 Guest</option>
            </select>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 mb-7 text-[13px] border-t border-white/5 pt-6">
          <div className="flex justify-between text-white/40">
            <span>₹{property.price?.toLocaleString('en-IN')} × 3 nights</span>
            <span>₹{(property.price * 3)?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-white/40">
            <span>Cleaning fee</span>
            <span>₹2,500</span>
          </div>
          <div className="flex justify-between text-white font-medium pt-3 border-t border-white/5">
            <span>Total</span>
            <span className="text-accent-gold">₹{((property.price * 3) + 2500)?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full bg-accent-gold text-black py-4 rounded-xl text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 active:scale-[0.98]">
          Reserve Sanctuary
        </button>

        <p className="text-center text-white/20 text-[11px] mt-4 tracking-wide">You won't be charged yet</p>
      </motion.div>
    </div>
  );
}
