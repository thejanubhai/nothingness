'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, X, CheckCircle2, XCircle, User, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationResult {
  allowed: boolean;
  memberName: string;
  memberId: string;
  pastStaysCount: number;
  lastStayProperty: string;
  lastStayCity: string;
  reason: string;
}

export default function LoungeQrScannerModal({ isOpen, onClose }: Props) {
  const [memberCode, setMemberCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  if (!isOpen) return null;

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCode.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch('/api/partner/verify-lounge-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberToken: memberCode.trim() })
      });

      const data = await res.json();
      setResult(data);

      if (data.allowed) {
        toast.success(`Access Granted: ${data.memberName}`, {
          description: `Verified ${data.pastStaysCount} past stay(s) in nothingness. network.`
        });
      } else {
        toast.error('Lounge Access Denied', {
          description: data.reason
        });
      }
    } catch (err: any) {
      toast.error('Validation error. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setMemberCode('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            <div>
              <h3 className="font-serif text-base text-white font-semibold">
                nothingness. Lounge Entry Verifier
              </h3>
              <p className="text-[10px] text-white/50 font-mono">
                Strict Gated Community Access · 1+ Past Stay Mandatory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Scanner Info */}
          <div className="p-3.5 rounded-xl bg-accent-gold/[0.04] border border-accent-gold/20 text-xs text-white/70 space-y-1">
            <p className="font-bold text-accent-gold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gated Verification Rule</span>
            </p>
            <p className="text-[11px] text-white/60">
              Only verified members who have completed <strong>at least 1 stay</strong> across ANY nothingness. sanctuary in India are permitted entry. Direct walk-ins are rejected.
            </p>
          </div>

          {!result ? (
            /* Input / QR Code Entry */
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/40">
                  Scan Member QR / Enter Member Pass ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    placeholder="e.g. NTH-VET-9824 or Guest Phone"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-accent-gold/50"
                  />
                  <button
                    type="submit"
                    disabled={validating || !memberCode.trim()}
                    className="bg-accent-gold hover:bg-white text-black px-5 py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Simulation Quick Buttons */}
              <div className="pt-2">
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/30 mb-2">Test Simulation Pass Codes:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMemberCode('NTH-VETTED-FLAGSHIP')}
                    className="p-2 rounded-lg bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 text-left text-[11px] text-white/70"
                  >
                    <span className="text-emerald-400 font-mono font-bold block">✓ Verified Member</span>
                    <span className="text-[10px] text-white/40">3 Completed Stays</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberCode('NTH-WALKIN-UNVERIFIED')}
                    className="p-2 rounded-lg bg-white/[0.02] border border-white/10 hover:border-rose-500/40 text-left text-[11px] text-white/70"
                  >
                    <span className="text-rose-400 font-mono font-bold block">✗ Walk-in / Direct</span>
                    <span className="text-[10px] text-white/40">0 Stays Recorded</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Result Display */
            <div className="space-y-4 text-center">
              {result.allowed ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg text-white font-bold">Lounge Entry Approved</h4>
                  <p className="text-sm font-semibold text-emerald-300">{result.memberName}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 text-left text-[11px] font-mono border-t border-emerald-500/20">
                    <div>
                      <span className="text-white/40 block">Past Stay History:</span>
                      <span className="text-white font-bold">{result.pastStaysCount} Completed Stays</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Recent Sanctuary:</span>
                      <span className="text-white">{result.lastStayProperty} ({result.lastStayCity})</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg text-white font-bold">Access Denied</h4>
                  <p className="text-xs text-rose-300 leading-relaxed max-w-xs mx-auto">
                    {result.reason}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">
                    Direct entry or walk-ins are strictly prohibited. Guest must complete at least 1 stay first.
                  </p>
                </div>
              )}

              <button
                onClick={resetScanner}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Scan Next Member
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
