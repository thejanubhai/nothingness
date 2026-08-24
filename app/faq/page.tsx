'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: "What exactly is Nothingness?",
    answer: "Nothingness is India's premier alternate lifestyle hospitality brand. We provide private, aesthetically curated spaces designed for sensory immersion, intimacy, custom architectural elements, premium textures, and absolute discretion."
  },
  {
    question: "Is my privacy guaranteed?",
    answer: "Absolutely. We understand that discretion is paramount for our guests. Our booking system is secure, properties have nondescript exteriors, and we have a strict policy against photography of the exterior or sharing exact locations publicly."
  },
  {
    question: "Are your properties safe and clean?",
    answer: "Yes. All our specialized fixtures and furnishings are industrial-grade and strictly vetted for structural safety. We also maintain sanitization protocols that exceed industry standards to ensure a completely safe and hygienic environment."
  },
  {
    question: "Do I need to bring my own accessories?",
    answer: "Our properties come equipped with a carefully selected range of high-end ambient fixtures, mood lighting, and curated amenities. However, you are welcome to bring your own personal accessories."
  },
  {
    question: "How does check-in work?",
    answer: "Check-in is 100% autonomous and keyless. Once your digital ID verification is completed per Delhi Police regulations, you receive a dynamic smart lockbox code directly on WhatsApp prior to arrival."
  },
  {
    question: "Can I host a party or bring unregistered visitors?",
    answer: "No. We maintain a strict 'No Unregistered Visitors' policy. Only registered guests whose IDs have been verified prior to check-in are permitted on the property. This is to ensure absolute privacy, safety, and discretion."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen pt-32 sm:pt-40 pb-24 px-5 sm:px-6 md:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12 sm:mb-20">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3 font-mono">Information &amp; Policies</p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 text-white">Frequently Asked Questions</h1>
        <p className="text-white/50 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Everything you need to know about your stay, safety protocols, and what to expect when you cross the threshold.
        </p>
      </div>

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
                  <div className="px-5 sm:px-7 pb-6 sm:pb-8 pt-1 text-white/60 text-xs sm:text-sm leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-16 sm:mt-24 text-center space-y-4">
        <p className="text-white/50 text-sm">Still have questions?</p>
        <Link 
          href="/contact" 
          className="inline-block bg-accent-gold hover:bg-white text-black px-8 py-3.5 rounded-full text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-xl"
        >
          Contact Concierge
        </Link>
      </div>
    </main>
  );
}
