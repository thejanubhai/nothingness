'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What is the commercial revenue split between Partner and nothingness.?',
    answer: 'The commercial structure is strictly 70% to the Partner and 30% to nothingness. Partners receive 70% of all gross sanctuary stays revenue, plus their share from integrated vetted members-only events and nothingness. Lounge F&B passes. Payouts are deposited directly into your bank account on your choice of Monthly (1st of month), Quarterly, or Annual schedule.'
  },
  {
    question: 'What is included in the ₹3 Lakh nothingness. Partner Setup Fee?',
    answer: 'The ₹3,00,000 base fee (PAN India) covers the complete operational onboarding of your property into the nothingness. ecosystem. This includes brand rights, hardware & IoT integration (encrypted WhatsApp smart lockbox access), local vendor supply chain setup (linens, luxury toiletries, aesthetic decor), parking & valet co-ordination, in-suite dining/food service integrations, and our automated State Police & Hospitality Statutory ID verification engine.'
  },
  {
    question: 'What are the property ownership and NOC affidavit requirements?',
    answer: 'Property ownership is strictly mandatory. The nothingness. portal automatically generates a legally valid Operational NOC & Affidavit draft governed under local and national hospitality statutes. The Partner prints, notarizes on stamp paper, and uploads the scan. The document is archived and verified manually by the nothingness admin team prior to go-live.'
  },
  {
    question: 'What is the cost difference between Budget and Luxury spaces?',
    answer: 'Fit-outs are executed on a 100% cost-to-cost basis. A Budget Space lands between ₹1 Lakh to ₹2 Lakhs per unit (clean, minimalist private sanctuary with mood lighting and acoustic privacy). A Luxury Space lands between ₹2 Lakhs to ₹4 Lakhs per unit (bespoke cinematic finishes, sensory ambient lighting, and high-end materials designed for top-tier RevPAR).'
  },
  {
    question: 'How does the nothingness. Lounge unlock work and who can enter?',
    answer: 'Partners operating more than 2 active properties in the same state (3+ spaces) unlock the exclusive nothingness. Lounge model, which can be configured on an open terrace, basement, or nearby suite. Entry is strictly gated via QR verification: a member must have an active nothingness account and must have completed at least 1 stay across ANY nothingness sanctuary in India. Direct walk-ins are prohibited.'
  },
  {
    question: 'How is guest discretion, legal compliance, and police harassment prevention handled?',
    answer: 'Every guest undergoes automated Aadhaar/Passport ID verification complying with respective state homestay, hotel, and local police check-in regulations. The partner dashboard includes an instant 1-click legal printout of guest dossiers if legally required by local authorities. Everything is 100% digital, transparent, and pre-vetted with strict zero-party rules.'
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
