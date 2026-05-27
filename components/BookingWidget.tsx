'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function BookingWidget({ properties = [] }: { properties?: { slug: string, title: string }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(properties[0]?.slug || '');
  const [isOpen, setIsOpen] = useState(false);

  const selectedTitle = properties.find(p => p.slug === selected)?.title || 'Select Property';

  const handleCheck = () => {
    if (selected) {
      router.push(`/properties/${selected}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-4xl"
    >
      <div className="bg-black/40 backdrop-blur-2xl border border-white/8 rounded-2xl md:rounded-full p-4 md:py-3 md:px-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-4 md:gap-0 items-center">
        
        {/* Property Selector */}
        <div className="flex-1 w-full md:w-auto md:border-r md:border-white/10 md:pr-5">
          <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 md:mb-0.5 px-1">Property</label>
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between text-white text-[15px] font-light tracking-wide py-1 px-1 hover:text-accent-gold transition-colors"
            >
              <span>{selectedTitle}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && properties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 w-full mt-2 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl"
              >
                {properties.map(p => (
                  <button
                    key={p.slug}
                    onClick={() => { setSelected(p.slug); setIsOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      p.slug === selected ? 'text-accent-gold bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex-1 w-full md:w-auto md:border-r md:border-white/10 md:px-5">
          <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 md:mb-0.5 px-1">Dates</label>
          <input 
            type="text" 
            placeholder="Select dates" 
            className="w-full bg-transparent text-white text-[15px] font-light tracking-wide focus:outline-none py-1 px-1 placeholder:text-white/30 cursor-pointer" 
            readOnly 
          />
        </div>

        {/* Guests */}
        <div className="flex-1 w-full md:w-auto md:px-5">
          <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1 md:mb-0.5 px-1">Guests</label>
          <select className="w-full bg-transparent text-white text-[15px] font-light tracking-wide focus:outline-none py-1 px-1 appearance-none cursor-pointer">
            <option className="bg-black text-white">2 Guests</option>
            <option className="bg-black text-white">1 Guest</option>
          </select>
        </div>

        {/* CTA */}
        <div className="w-full md:w-auto md:ml-3">
          <button 
            onClick={handleCheck}
            className="w-full md:w-auto bg-accent-gold text-black px-8 py-3.5 rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 active:scale-95"
          >
            Check Availability
          </button>
        </div>
      </div>
    </motion.div>
  );
}
