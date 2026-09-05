'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  HeartHandshake, 
  EyeOff, 
  Feather, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';

export const DYNAMIC_ROLES_TAGS = [
  'Dominant',
  'Submissive',
  'Switch',
  'Shibari Artisan',
  'Primal',
  'Sadist',
  'Masochist',
  'Brat',
  'Rigger',
  'Rope Bunny',
  'Protocol',
  'Pet Play',
  'Voyeur',
  'Exhibitionist',
] as const;

export const ORIENTATION_UNIT_TAGS = [
  'Solo Female',
  'Solo Male',
  'Couple (M+F)',
  'Couple (F+F)',
  'Non-Binary',
  'Poly Dyad',
] as const;

export const DESIRED_CONTEXTS_TAGS = [
  'Conversational Salon',
  'Shibari Jam',
  'Sensory Exploration',
  'Noir Masquerade',
  'Private Suite',
] as const;

export const DYNAMIC_TAGS = DYNAMIC_ROLES_TAGS;
export const CONTEXT_TAGS = DESIRED_CONTEXTS_TAGS;

interface DesireResonanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlias: string;
  targetAvatar?: string;
  onMatched?: (chamberToken: string, targetAlias: string) => void;
  onResonated?: () => void;
}

export default function DesireResonanceModal({
  isOpen,
  onClose,
  targetAlias,
  targetAvatar,
  onMatched,
  onResonated,
}: DesireResonanceModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(['Switch', 'Sensory Exploration']);
  const [submitting, setSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<{ isMutual: boolean; chamberToken?: string } | null>(null);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    triggerHaptic('light');
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleResonateSubmit = async () => {
    setSubmitting(true);
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/kinkster/resonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAlias,
          tags: selectedTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock resonance.');

      if (data.isMutual) {
        triggerHaptic('resonance');
        setMatchResult({ isMutual: true, chamberToken: data.chamberToken });
        toast.success('Mutual Resonance Matched!', {
          description: `Both of you resonated! Confidential chamber unlocked with @${targetAlias}.`,
        });
      } else {
        triggerHaptic('success');
        setMatchResult({ isMutual: false });
        toast.success('Resonance Locked in Vault', {
          description: `Kept 100% confidential. @${targetAlias} will never be alerted unless mutual.`,
        });
      }
    } catch (err: any) {
      triggerHaptic('warning');
      toast.error('Error', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Dual-Blind Desire Resonance</h3>
              <p className="text-[10px] text-zinc-400 font-mono">100% Confidential • Zero Rejection</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Target Profile Card Preview */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <img
              src={targetAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
              alt={targetAlias}
              className="w-12 h-12 rounded-full object-cover border border-rose-500/40 p-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white font-mono truncate">@{targetAlias}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">ID Vetted Sanctuary Guest</p>
            </div>
          </div>

          {/* MUTUAL MATCH RESULT SCREEN */}
          {matchResult?.isMutual ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-purple-950/30 to-zinc-950 border border-rose-500/40 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-serif">Dual-Blind Lock Confirmed!</h4>
                <p className="text-xs text-zinc-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  Both of you expressed mutual intention. A private ephemeral chat room is now active for the next 24 hours.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onMatched && matchResult.chamberToken) {
                    onMatched(matchResult.chamberToken, targetAlias);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 cursor-pointer font-mono uppercase tracking-wider"
              >
                <span>Enter Confidential Chamber →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : matchResult ? (
            /* SINGLE-SIDED CONFIDENTIAL LOCK SCREEN */
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Confidential Resonance Saved</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your intention is sealed in our private vault for 48 hours. If @{targetAlias} mutually taps resonate with you, a private chamber will unlock automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          ) : (
            /* TAG SELECTOR */
            <>
              {/* Privacy Guarantee Note */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-start gap-2.5 text-[11px] text-zinc-400 leading-relaxed">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Dual-Blind Privacy:</strong> @{targetAlias} will <span className="text-amber-300">never receive a notification</span> or know you resonated. Only if they also resonate with you will a connection unlock.
                </span>
              </div>

              {/* Dynamic & Roles Tags */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Select Resonance Dynamics
                </label>
                <div className="flex flex-wrap gap-2">
                  {DYNAMIC_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white border border-rose-400/40 shadow-sm font-bold scale-[1.02]'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Contexts */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Ideal Shared Context
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXT_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleResonateSubmit}
                disabled={submitting || selectedTags.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer font-mono uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>Lock In Desire Resonance</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
