'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, AlertCircle, X, AtSign } from 'lucide-react';
import { toast } from 'sonner';

interface KinksterActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIdVerified: boolean;
  onActivated: () => void;
  onOpenIdVerification?: () => void;
}

export default function KinksterActivationModal({
  isOpen,
  onClose,
  isIdVerified,
  onActivated,
  onOpenIdVerification
}: KinksterActivationModalProps) {
  const [alias, setAlias] = useState('');
  const [bio, setBio] = useState('');
  const [confidentialityAgreed, setConfidentialityAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Luxury Stays', 'Discretion']);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter(t => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleActivate = async () => {
    if (!isIdVerified) {
      toast.error('ID Verification Required to activate Kinkster Mode.');
      if (onOpenIdVerification) onOpenIdVerification();
      return;
    }

    if (!alias.trim() || alias.trim().length < 3) {
      toast.error('Please enter a valid unique alias (at least 3 characters).');
      return;
    }

    if (!confidentialityAgreed) {
      toast.error('You must accept the Confidentiality & Discretion Agreement to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias: alias.trim(),
          bio: bio.trim(),
          confidentiality_agreed: true,
          interests: selectedInterests
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate Kinkster Mode');
      }

      toast.success(`Welcome to Nothingness Kinksters! Your alias @${data.profile.alias} is now active.`);
      onActivated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during activation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glowing Background Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/60 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 rounded-xl text-rose-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Activate Kinkster Mode</h2>
            <p className="text-xs text-zinc-400">ID-Vetted Discretionary Social & Dating Space</p>
          </div>
        </div>

        {/* Step 1: ID Vetting Badge */}
        <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 transition-colors ${
          isIdVerified 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}>
          {isIdVerified ? (
            <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
          )}
          <div className="flex-1 text-xs">
            <p className="font-semibold text-sm">
              {isIdVerified ? 'ID Vetted & Verified Guest' : 'ID Verification Required'}
            </p>
            <p className="mt-1 opacity-90">
              {isIdVerified
                ? 'Your Aadhaar/Passport verification is active. Your legal identity remains 100% private & encrypted.'
                : 'Police Compliance & Hospitality rules require Aadhaar/Passport verification before entering Kinkster Mode.'}
            </p>
            {!isIdVerified && onOpenIdVerification && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIdVerification();
                }}
                className="mt-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-all shadow-md"
              >
                Verify ID Now
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Unique Alias Picker */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Choose Your Unique Alias
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
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Your alias acts as your unique identity. Real names are NEVER exposed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Kinkster Bio
            </label>
            <textarea
              rows={2}
              placeholder="Share your aesthetic, stay vibes, or discretion preferences..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Interests & Vibes
            </label>
            <div className="flex flex-wrap gap-2">
              {['Luxury Stays', 'Discretion', 'Aesthetic Photography', 'VIP Lounges', 'Private Events', 'Late Night Vibes'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedInterests.includes(tag)
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Confidentiality Agreement */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            Confidentiality & Mutual Discretion Agreement
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            I agree that all content, profiles, media, and conversations within Nothingness Kinkster Mode are strictly confidential. I will not screenshot, leak, or disclose member details outside this platform.
          </p>
          <label className="flex items-center gap-3 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={confidentialityAgreed}
              onChange={(e) => setConfidentialityAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950"
            />
            <span className="text-xs text-zinc-200 font-medium">
              I agree to the Confidentiality & Mutual Privacy Policy
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <button
          onClick={handleActivate}
          disabled={loading || !isIdVerified || !confidentialityAgreed || !alias}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-pulse">Activating Kinkster Mode...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Activate Kinkster Mode
            </>
          )}
        </button>

      </div>
    </div>
  );
}
