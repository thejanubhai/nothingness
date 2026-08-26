'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {faqs.map((faq, idx) => (
        <div 
          key={idx} 
          className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden shadow-lg transition-colors"
        >
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between p-5 sm:p-7 text-left hover:bg-white/[0.02] transition-colors gap-4"
          >
            <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-white pr-2">{faq.question}</h3>
            <ChevronDown 
              className={`w-5 h-5 text-accent-gold shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} 
            />
          </button>
          <AnimatePresence>
            {openIndex === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="px-5 sm:px-7 pb-6 sm:pb-8 pt-1 text-white/60 text-xs sm:text-sm leading-relaxed border-t border-white/5 font-sans">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
