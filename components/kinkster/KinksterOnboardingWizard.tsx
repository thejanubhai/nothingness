'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Star,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AtSign,
  X,
  Building2,
  Ticket,
  Check,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface KinkOption {
  id: string;
  name: string;
  category: string;
  intensity: number; // 1-5
}

interface KinksterOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  isIdVerified: boolean;
  isStayVerified?: boolean;
  entryFee?: number;
  onCompleted: () => void;
  onOpenIdVerification?: () => void;
  onOpenStayVerification?: () => void;
}

const DEFAULT_KINKS: KinkOption[] = [
  { id: 'shibari', name: 'Rope Art & Shibari Aesthetics', category: 'Aesthetic', intensity: 3 },
  { id: 'dom_sub', name: 'Dominance & Surrender Dynamics', category: 'Dynamics', intensity: 4 },
  { id: 'sensory', name: 'Sensory Deprivation & Blindfolds', category: 'Sensory', intensity: 3 },
  { id: 'roleplay', name: 'Roleplay & Atmospheric Storytelling', category: 'Creative', intensity: 3 },
  { id: 'aftercare', name: 'Mindfulness & Grounded Aftercare', category: 'Emotional', intensity: 5 },
  { id: 'sensory_bath', name: 'Sensory Soaking Baths & Spa', category: 'Luxury Vibe', intensity: 4 }
];

export default function KinksterOnboardingWizard({
  isOpen,
  onClose,
  isIdVerified,
  isStayVerified = false,
  entryFee: propEntryFee,
  onCompleted,
  onOpenIdVerification,
  onOpenStayVerification
}: KinksterOnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [alias, setAlias] = useState('');
  const [bio, setBio] = useState('');
  const [kinks, setKinks] = useState<KinkOption[]>(DEFAULT_KINKS);
  const [effectiveFee, setEffectiveFee] = useState<number>(propEntryFee ?? 0);

  // Step 3 Questionnaire Answers
  const [stayDynamic, setStayDynamic] = useState<'solo' | 'couple' | 'host'>('solo');
  const [primaryIntent, setPrimaryIntent] = useState<'discreet_stays' | 'aesthetic_chemistry' | 'sanctuary_co_hosting'>('discreet_stays');
  
  // Step 4 Discretion Check
  const [confidentialityAgreed, setConfidentialityAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propEntryFee !== undefined && propEntryFee !== null) {
      setEffectiveFee(propEntryFee);
    } else {
      fetch('/api/kinkster/info')
        .then(r => r.json())
        .then(data => {
          if (data.entry_fee !== undefined) setEffectiveFee(Number(data.entry_fee));
        })
        .catch(() => {});
    }
  }, [propEntryFee]);

  if (!isOpen) return null;

  const handleKinkIntensityChange = (id: string, stars: number) => {
    setKinks(kinks.map(k => k.id === id ? { ...k, intensity: stars } : k));
  };

  const handleNextStepFromStep1 = () => {
    if (!alias.trim() || alias.trim().length < 3) {
      toast.error('Please choose a valid unique moniker (at least 3 characters).');
      return;
    }

    setStep(2);
  };

  const handleFinish = async () => {
    if (!isIdVerified) {
      toast.error('Identity Verification Required before completing onboarding.');
      if (onOpenIdVerification) onOpenIdVerification();
      return;
    }

    if (!alias.trim() || alias.trim().length < 3) {
      toast.error('Please enter a valid unique moniker (at least 3 characters).');
      return;
    }

    if (!confidentialityAgreed) {
      toast.error('You must accept the Confidentiality & Mutual Discretion Agreement.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: alias.trim(),
          bio: bio.trim(),
          kinks,
          onboarding_answers: {
            stay_dynamic: stayDynamic,
            primary_intent: primaryIntent,
            discretion_commitment: true
          },
          confidentiality_agreed: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onboarding submission failed');

      if (data.requiresPayment) {
        toast.info(`Connecting to PayU for ₹${data.fee?.toLocaleString('en-IN')} Membership Fee...`);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;

        Object.entries(data.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      toast.success(`Welcome to The Circle! Your moniker @${data.profile?.alias || alias} is active.`);
      onCompleted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Onboarding error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full z-10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">The Circle Initiation</h2>
              <p className="text-xs text-zinc-400">Step {step} of 4 • Confidential Sanctuary Setup</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-rose-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Prerequisites & Alias */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Prerequisite Checkcards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Check 1: Govt ID */}
              <div className={`p-3.5 rounded-2xl border flex flex-col justify-between text-xs transition-all ${
                isIdVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-bold">Identity Verification</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 mb-2">
                  {isIdVerified ? '✓ Identity Verified (100% Private)' : 'Aadhaar or Passport required for discretion.'}
                </p>
                {!isIdVerified && (
                  <button
                    type="button"
                    onClick={onOpenIdVerification}
                    className="w-full py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
                  >
                    Verify Govt ID
                  </button>
                )}
              </div>

              {/* Check 2: Mandatory Stay */}
              <div className={`p-3.5 rounded-2xl border flex flex-col justify-between text-xs transition-all ${
                isStayVerified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-bold">Sanctuary Stay</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 mb-2">
                  {isStayVerified ? '✓ Verified Nothingness Guest' : '1 previous stay required (Airbnb/MMT/Chat).'}
                </p>
                {!isStayVerified && (
                  <button
                    type="button"
                    onClick={onOpenStayVerification}
                    className="w-full py-1.5 px-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer"
                  >
                    Link Sanctuary Stay
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Choose Your Private Moniker (@alias)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500">
                  <AtSign className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="shadow_velvet"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Real names are NEVER visible to other members.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Personal Bio &amp; Discretion Notes
              </label>
              <textarea
                rows={3}
                placeholder="Share your aesthetic sensibilities, favorite stay vibes, or conversation preferences..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Kinks & Star Ratings (1-5 Stars) */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Aesthetic Sensibilities</h3>
              <p className="text-xs text-zinc-400 mb-4">Set your affinity level (1 to 5 Stars) for thoughtful chemistry alignment.</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {kinks.map((kink) => (
                <div key={kink.id} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">{kink.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{kink.category}</span>
                  </div>

                  {/* 5-Star Rating Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleKinkIntensityChange(kink.id, star)}
                        className={`p-1 transition-transform hover:scale-125 cursor-pointer ${
                          star <= kink.intensity ? 'text-amber-400' : 'text-zinc-700'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Lifestyle & Stay Questionnaire */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Travel &amp; Stay Dynamics</h3>
              <p className="text-xs text-zinc-400">Specify your travel dynamics and primary intentions for sanctuary connections.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Travel / Stay Dynamic
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'solo', label: 'Solo Traveler' },
                  { id: 'couple', label: 'Lifestyle Couple' },
                  { id: 'host', label: 'Private Host' }
                ].map((dyn) => (
                  <button
                    key={dyn.id}
                    type="button"
                    onClick={() => setStayDynamic(dyn.id as any)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      stayDynamic === dyn.id
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {dyn.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Primary Intention
              </label>
              <div className="space-y-2">
                {[
                  { id: 'discreet_stays', title: 'Luxury Discreet Stays', desc: 'Private stays at Nothingness properties with zero public exposure.' },
                  { id: 'aesthetic_chemistry', title: 'Aesthetic & Lifestyle Chemistry', desc: 'Connecting with vetted members matching your sensibilities.' },
                  { id: 'sanctuary_co_hosting', title: 'Sanctuary Co-Hosting', desc: 'Sharing private suite bookings and exclusive soirées.' }
                ].map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => setPrimaryIntent(intent.id as any)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      primaryIntent === intent.id
                        ? 'bg-rose-500/10 border-rose-500/50 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{intent.title}</span>
                    <span className="text-[10px] text-zinc-500 leading-relaxed block mt-0.5">{intent.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Lifetime Membership Pass & Confidentiality Agreement */}
        {step === 4 && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Membership Pass Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-purple-600/10 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white text-sm">The Sovereign Lifetime Pass</span>
                </div>
                <span className="text-lg font-bold font-mono text-amber-300">
                  {effectiveFee > 0 ? `₹${effectiveFee.toLocaleString('en-IN')}` : 'Complimentary'}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                One-time membership entry barrier. Zero recurring subscriptions. Guarantees that every member is invested in mutual discretion and respectful sanctuary etiquette.
              </p>

              <div className="space-y-1.5 text-[11px] text-zinc-300 font-mono pt-1 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Moniker: <strong className="text-rose-400">@{alias || 'alias'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct messaging unlocks solely on mutual sparks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invitations to private discussions &amp; midnight soirées</span>
                </div>
              </div>
            </div>

            {/* Confidentiality Checkbox */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                Confidentiality &amp; Discretion Agreement
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                By entering The Circle, I pledge that all member profiles, media, and conversations are strictly confidential. I commit to zero screenshots, zero leaks, and absolute mutual consent at all times.
              </p>
              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confidentialityAgreed}
                  onChange={(e) => setConfidentialityAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-xs text-zinc-200 font-medium">
                  I agree to the Confidentiality &amp; Discretion Policy
                </span>
              </label>
            </div>

            {!isIdVerified && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Prerequisite to finalize membership:
                </p>
                <div className="flex flex-wrap gap-2">
                  {onOpenIdVerification && (
                    <button
                      type="button"
                      onClick={onOpenIdVerification}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Verify Govt ID (1-Click) →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-900 mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={step === 1 ? handleNextStepFromStep1 : () => setStep(step + 1)}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading || !confidentialityAgreed || !isIdVerified}
              className="px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                'Processing Initiation...'
              ) : effectiveFee > 0 ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Activate Pass • ₹{effectiveFee.toLocaleString('en-IN')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Initiation &amp; Enter Circle</span>
                </>
              )}
            </button>
          )}
        </div>

        {effectiveFee > 0 && step === 4 && (
          <p className="text-[10px] text-center text-zinc-500 font-mono mt-3">
            Secure 256-bit encrypted PayU checkout • Statement Descriptor: <strong className="text-zinc-400">PAYU*NOTHINGNESS</strong>
          </p>
        )}

      </div>
    </div>
  );
}
