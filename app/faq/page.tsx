'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What exactly is Nothingness?",
    answer: "Nothingness is India's first and only kink and BDSM-friendly hospitality brand. We provide private, aesthetically curated spaces designed for profound exploration, complete with specialized equipment, premium textures, and absolute discretion."
  },
  {
    question: "Is my privacy guaranteed?",
    answer: "Absolutely. We understand that discretion is paramount for our community. Our booking system is secure, properties have nondescript exteriors, and we have a strict policy against photography of the exterior or sharing exact locations publicly."
  },
  {
    question: "Are your properties safe?",
    answer: "Yes. All our specialized equipment is industrial-grade and strictly vetted for safety. We also maintain sanitization protocols that exceed industry standards to ensure a completely safe and hygienic environment."
  },
  {
    question: "Do I need to bring my own equipment?",
    answer: "Our properties come equipped with a carefully selected range of high-end specialized equipment, such as St. Andrews crosses and suspension hardpoints. However, you are welcome to bring your own personal, smaller accessories."
  },
  {
    question: "What happens if I break something?",
    answer: "We expect guests to use the equipment safely and as intended. Any damage caused by improper use, negligence, or exceeding weight limits will be charged directly to the payment method on file."
  },
  {
    question: "Can I host a party or bring visitors?",
    answer: "No. We have a strict 'No Visitors' policy. Only registered guests whose IDs have been verified prior to check-in are permitted on the property. This is to ensure privacy, safety, and respect for our neighbors."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Information</p>
        <h1 className="font-serif text-5xl md:text-6xl mb-6">Frequently Asked Questions</h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Everything you need to know about your stay, our policies, and what to expect when you cross the threshold.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 md:p-8 text-left hover:bg-white/[0.02] transition-colors"
            >
              <h3 className="font-serif text-xl md:text-2xl text-white pr-8">{faq.question}</h3>
              <ChevronDown 
                className={`w-6 h-6 text-accent-gold shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} 
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
                  <div className="px-6 md:px-8 pb-8 pt-2 text-white/60 leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-24 text-center">
        <p className="text-white/50 mb-6">Still have questions?</p>
        <a 
          href="/contact" 
          className="inline-block border border-accent-gold/50 text-accent-gold px-8 py-3 rounded-full text-[13px] font-semibold tracking-[0.15em] uppercase hover:bg-accent-gold hover:text-black transition-all duration-300"
        >
          Contact Concierge
        </a>
      </div>
    </main>
  );
}
