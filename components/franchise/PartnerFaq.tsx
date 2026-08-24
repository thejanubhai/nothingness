'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What is included in the ₹3 Lakh nothingness. Partner Setup Fee?',
    answer: 'The ₹3,00,000 base fee (PAN India) covers the complete operational onboarding of your property into the nothingness. ecosystem. This includes brand rights, hardware & IoT integration (encrypted WhatsApp smart lockbox access), local vendor supply chain setup (linens, luxury toiletries, aesthetic decor), parking & valet co-ordination, in-suite dining/food service integrations, and our automated State Police & Hospitality Statutory ID verification engine.'
  },
  {
    question: 'What is the cost difference between Budget and Luxury spaces?',
    answer: 'Fit-outs are executed on a 100% cost-to-cost basis. A Budget Space lands between ₹1 Lakh to ₹2 Lakhs per unit (clean, minimalist private sanctuary with mood lighting and acoustic privacy). A Luxury Space lands between ₹2 Lakhs to ₹4 Lakhs per unit (bespoke cinematic finishes, sensory ambient lighting, and high-end materials designed for top-tier RevPAR).'
  },
  {
    question: 'How does the nothingness. Lounge unlock work?',
    answer: 'Partners operating more than 2 active properties in the same state (3+ spaces) unlock the exclusive nothingness. Lounge model. This creates a gated, members-only community lounge for vetted nothingness. members, generating its own high-margin F&B, event ticketing, and membership revenue stream.'
  },
  {
    question: 'How do integrated vetted members-only events generate revenue?',
    answer: 'Unlike generic Airbnbs, nothingness. connects to a private, highly active vetted lifestyle and creative community. Partners participate in curated events, host networking sessions, and member gathering activations, creating an auxiliary revenue stream of ₹15,000–₹35,000+ monthly on top of stay bookings.'
  },
  {
    question: 'How is guest discretion, legal compliance, and property safety strictly enforced?',
    answer: 'Every guest undergoes automated Aadhaar/Passport ID verification complying with respective state homestay, hotel, and local police check-in regulations. Because check-in is 100% digital, legal, and pre-vetted, property owners operate with total peace of mind—free from licensing department or police harassment, with zero unauthorized visitors and strict zero-party rules.'
  },
  {
    question: 'What are the expansion priority states?',
    answer: 'Our rollout begins in Delhi (active flagship), followed by Haryana (Gurgaon/NCR), Uttar Pradesh (Noida/Lucknow), Maharashtra (Mumbai/Pune), Karnataka (Bengaluru), Goa, and Manipur, before expanding into other Pan-India high-demand corridors.'
  }
];

export default function PartnerFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="space-y-6">
      <div className="text-center max-w-xl mx-auto mb-8">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-gold/80 font-mono mb-2">
          Investor &amp; Host Clarity
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-white">
          Frequently Answered <span className="text-accent-gold italic">Questions</span>
        </h2>
        <p className="text-white/60 text-xs sm:text-sm mt-1">
          Everything you need to know about the financials, fit-outs, and operational ecosystem.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-white/[0.03] border-accent-gold/30 shadow-lg'
                  : 'bg-white/[0.01] border-white/5 hover:border-white/15'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-serif text-base sm:text-lg text-white font-medium">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-accent-gold shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
