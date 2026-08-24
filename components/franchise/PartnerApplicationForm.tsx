'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, CheckCircle2, UserCheck, ArrowRight, Building, KeyRound, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function PartnerApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [state, setState] = useState('Delhi (NCT)');
  const [spaceTier, setSpaceTier] = useState('luxury');
  const [units, setUnits] = useState('1');
  const [propertyStatus, setPropertyStatus] = useState('ready_to_furnish');
  const [budgetTier, setBudgetTier] = useState('3_to_7_lakhs');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      state: state,
      city: formData.get('city'),
      location: `${formData.get('city')}, ${state} (${formData.get('neighborhood') || ''})`,
      space_tier: spaceTier,
      units: units,
      carpet_area: formData.get('carpet_area'),
      property_status: propertyStatus,
      budget: formData.get('budget'),
      experience: formData.get('experience'),
      wants_lounge: parseInt(units) >= 3,
    };

    try {
      const res = await fetch('/api/franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit application.');

      setSubmitted(true);
      toast.success('Partner Application Received', {
        description: 'Our expansion team will review your property feasibility and reach out via WhatsApp/email.',
      });
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="apply-section" className="scroll-mt-24">
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Ambient Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.06),transparent_60%)]" />

        {submitted ? (
          <div className="relative z-10 text-center py-12 px-4 max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl text-white">Application Received</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Thank you for applying to become a <span className="font-mono text-white">nothingness.</span> Partner. Our regional expansion team will evaluate your location feasibility and reach out within 24–48 hours with a customized property blueprint.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50 text-left space-y-1">
              <p className="font-mono text-accent-gold uppercase tracking-widest text-[10px]">Next Steps:</p>
              <p>1. Property feasibility &amp; discretion audit.</p>
              <p>2. Cost-to-cost fit-out estimate &amp; smart access review.</p>
              <p>3. WhatsApp concierge onboarding call.</p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs uppercase tracking-widest text-accent-gold hover:text-white transition-colors underline underline-offset-4"
            >
              Submit Another Property
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-mono uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Partner Onboarding Application
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-3">
                Apply to Become a <span className="text-accent-gold italic">nothingness.</span> Partner
              </h2>
              <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                ₹3,00,000 base operational setup fee (PAN India) with cost-to-cost landing fit-outs. Connect your property to our high-yield sanctuary network.
              </p>
            </div>

            {/* Verified Account Notice */}
            <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-gold shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Have an active nothingness. account?</p>
                  <p className="text-[11px] text-white/50">Verified members receive accelerated feasibility review and priority onboarding.</p>
                </div>
              </div>
              <Link
                href="/auth"
                className="text-[11px] font-mono uppercase tracking-wider text-accent-gold hover:text-white border border-accent-gold/30 hover:border-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In / Verify
              </Link>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Space Tier & Unit Count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Target Space Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSpaceTier('budget')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        spaceTier === 'budget'
                          ? 'bg-accent-gold/10 border-accent-gold text-white'
                          : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">Budget Space</p>
                      <p className="text-[10px] text-accent-gold font-mono">₹1L – ₹2L fit-out /unit</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpaceTier('luxury')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        spaceTier === 'luxury'
                          ? 'bg-accent-gold/10 border-accent-gold text-white'
                          : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">Luxury Space</p>
                      <p className="text-[10px] text-accent-gold font-mono">₹2L – ₹4L fit-out /unit</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="units" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Number of Spaces / Properties
                  </label>
                  <select
                    id="units"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  >
                    <option value="1" className="bg-black text-white">1 Space (Single Sanctuary)</option>
                    <option value="2" className="bg-black text-white">2 Spaces (Dual Setup)</option>
                    <option value="3" className="bg-black text-white">3 Spaces (Unlocks nothingness. Lounge ✨)</option>
                    <option value="4" className="bg-black text-white">4 Spaces</option>
                    <option value="5+" className="bg-black text-white">5+ Spaces (Portfolio Operator)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="state" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    State / Region
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  >
                    <option value="Delhi (NCT)" className="bg-black text-white">Delhi (NCT)</option>
                    <option value="Haryana" className="bg-black text-white">Haryana (Gurgaon / NCR)</option>
                    <option value="Uttar Pradesh" className="bg-black text-white">Uttar Pradesh (Noida / Lucknow)</option>
                    <option value="Maharashtra" className="bg-black text-white">Maharashtra (Mumbai / Pune)</option>
                    <option value="Karnataka" className="bg-black text-white">Karnataka (Bengaluru)</option>
                    <option value="Goa" className="bg-black text-white">Goa</option>
                    <option value="Manipur" className="bg-black text-white">Manipur (Imphal / Hills)</option>
                    <option value="Other State" className="bg-black text-white">Other State / Territory</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    City / Town
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    type="text"
                    placeholder="e.g. New Delhi, Gurgaon, Mumbai"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="neighborhood" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Neighborhood / Locality
                  </label>
                  <input
                    id="neighborhood"
                    name="neighborhood"
                    required
                    type="text"
                    placeholder="e.g. Hauz Khas, Bandra West, Indiranagar"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
              </div>

              {/* Row 3: Carpet Area & Property Readiness */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="carpet_area" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Approx. Carpet Area (sq ft)
                  </label>
                  <input
                    id="carpet_area"
                    name="carpet_area"
                    type="text"
                    placeholder="e.g. 850 sq ft / 1400 sq ft"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="property_status" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Property Status
                  </label>
                  <select
                    id="property_status"
                    value={propertyStatus}
                    onChange={(e) => setPropertyStatus(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  >
                    <option value="ready_to_furnish" className="bg-black text-white">Ready to Furnish / Raw Space</option>
                    <option value="fully_furnished" className="bg-black text-white">Furnished (Needs Aesthetic Upgrade)</option>
                    <option value="under_construction" className="bg-black text-white">Under Construction / Renovation</option>
                    <option value="exploring_lease" className="bg-black text-white">Looking to Acquire / Lease Property</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="budget" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Total Investment Capacity
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  >
                    <option value="₹4L - ₹7L (1-2 Spaces)" className="bg-black text-white">₹4L – ₹7L (1–2 Spaces)</option>
                    <option value="₹7L - ₹15L (3-4 Spaces + Lounge)" className="bg-black text-white">₹7L – ₹15L (3–4 Spaces + Lounge)</option>
                    <option value="₹15L - ₹35L (Multi-Unit Portfolio)" className="bg-black text-white">₹15L – ₹35L (Multi-Unit Portfolio)</option>
                    <option value="Above ₹35L (City Master Partner)" className="bg-black text-white">Above ₹35L (City Master Partner)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    type="text"
                    placeholder="Your Full Name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    required
                    type="email"
                    placeholder="name@domain.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                    WhatsApp Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
              </div>

              {/* Row 5: Notes & Experience */}
              <div className="space-y-1.5">
                <label htmlFor="experience" className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono">
                  Property Notes / Background / Questions
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={3}
                  placeholder="Share details about the property building, parking availability, timeline to launch, or any specific questions for the nothingness. team..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    'Processing Application...'
                  ) : (
                    <>
                      <span>Submit Partner Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-white/40 mt-3">
                  All inquiries handled with strict confidentiality. Non-disclosure standards apply.
                </p>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
