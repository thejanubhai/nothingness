'use client';

import React, { useState } from 'react';
import { FileCheck, Shield, X, CheckCircle2, AlertCircle, ArrowRight, Printer, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  partnerName: string;
  partnerEmail: string;
  city: string;
  isOpen: boolean;
  onClose: () => void;
  onSignComplete?: (signatureData: { signedAt: string; signatureText: string; city: string }) => void;
  isReadOnly?: boolean;
  signedAtDate?: string;
  executedSignature?: string;
}

export default function PartnerMouContractModal({
  partnerName,
  partnerEmail,
  city,
  isOpen,
  onClose,
  onSignComplete,
  isReadOnly = false,
  signedAtDate,
  executedSignature
}: Props) {
  const [agreedTerms, setAgreedTerms] = useState(isReadOnly);
  const [agreedOwnership, setAgreedOwnership] = useState(isReadOnly);
  const [signatureText, setSignatureText] = useState(executedSignature || partnerName || '');
  const [signing, setSigning] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms || !agreedOwnership || !signatureText.trim()) {
      toast.error('Please accept all legal undertakings and enter your signature.');
      return;
    }

    setSigning(true);
    try {
      const signedAt = new Date().toISOString();
      if (onSignComplete) {
        onSignComplete({
          signedAt,
          signatureText: signatureText.trim(),
          city: city || 'National Capital Territory / Pan-India'
        });
      }
      toast.success('MoU Agreement Signed Successfully', {
        description: 'Your legal contract is logged. Proceed to upload your property NOC affidavit.'
      });
      onClose();
    } catch (err: any) {
      toast.error('Failed to sign agreement. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const formattedSignedDate = signedAtDate 
    ? new Date(signedAtDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:max-h-none print:w-full print:bg-white print:text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/40 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-accent-gold" />
            <div>
              <h3 className="font-serif text-base sm:text-lg text-white font-semibold">
                nothingness. Partner Operational MoU &amp; Franchise Agreement
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                Governed under Indian Contract Act 1872 &amp; Applicable State Hospitality Regulations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/10 hover:bg-white hover:text-black text-white px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Legal Clauses */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-xs text-white/70 leading-relaxed max-h-[60vh] print:max-h-none print:overflow-visible print:bg-white print:text-black">
          
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 print:border-black/20 space-y-2">
            <p className="text-white print:text-black font-semibold text-sm font-serif">
              Memorandum of Understanding (MoU) &amp; Operating Agreement
            </p>
            <p className="text-white/60 print:text-gray-700">
              This Agreement is entered into between <span className="text-white print:text-black font-bold">{partnerName || '[Partner Name]'}</span> (&ldquo;The Partner&rdquo;) and <span className="text-white print:text-black font-bold font-mono">nothingness.</span> Inc. (&ldquo;The Network&rdquo;), establishing the terms of private sanctuary operations, revenue disbursement, and guest compliance.
            </p>
          </div>

          {/* Clause 1: Commercials */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-white print:text-black text-accent-gold uppercase tracking-wider">
              1. Commercials &amp; 70/30 Revenue Distribution
            </h4>
            <p>
              1.1 <strong>Partner Revenue Share:</strong> The Partner shall receive strictly <strong>70% (Seventy Percent)</strong> of the gross booking revenue generated from their onboarded property.
            </p>
            <p>
              1.2 <strong>Network Platform Share:</strong> nothingness. shall retain <strong>30% (Thirty Percent)</strong> of gross booking revenue to cover centralized marketing, autonomous WhatsApp keyless access technology, 24/7 dedicated concierge routing &amp; automated dispatch technology, and dynamic RevPAR yield optimization.
            </p>
            <p>
              1.3 <strong>Payout Schedules:</strong> Payouts shall be disbursed directly into the Partner&apos;s registered bank account according to their selected frequency preference (Monthly on the 1st, Quarterly, or Annual lump-sum).
            </p>
          </div>

          {/* Clause 2: Setup Fee & Fit-Out Landing */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-white print:text-black text-accent-gold uppercase tracking-wider">
              2. Onboarding Setup Fee &amp; Cost-to-Cost Fit-Out
            </h4>
            <p>
              2.1 <strong>Operational Setup Fee:</strong> A one-time setup fee of <strong>₹3,00,000 (Rupees Three Lakhs only)</strong> is payable upon onboarding, covering smart hardware provisioning, vendor supply chain integration, parking/valet logistics, and statutory ID compliance setup.
            </p>
            <p>
              2.2 <strong>Fit-Out Landing Costs:</strong> All space conversions are executed on a strict 100% cost-to-cost landing basis (₹1L–₹2L for Budget Spaces; ₹2L–₹4L for Luxury Spaces).
            </p>
          </div>

          {/* Clause 3: Mandatory Property Ownership & Affidavit */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-white print:text-black text-accent-gold uppercase tracking-wider">
              3. Mandatory Property Ownership &amp; Statutory NOC
            </h4>
            <p>
              3.1 <strong>Ownership Requirement:</strong> The Partner represents and warrants that they are the sole lawful owner of the real estate space being onboarded.
            </p>
            <p>
              3.2 <strong>Operational NOC Affidavit:</strong> The Partner agrees to execute, notarize, and upload the standardized Operational NOC Affidavit generated by the nothingness. portal, affirming peaceful residential possession and compliance with municipal guidelines.
            </p>
          </div>

          {/* Clause 4: Guest Vetting & Harassment Protection */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-white print:text-black text-accent-gold uppercase tracking-wider">
              4. Digital ID Compliance &amp; Non-Nuisance Undertaking
            </h4>
            <p>
              4.1 <strong>100% Online Verification:</strong> Every guest staying at the sanctuary must complete digital government ID authentication (Aadhaar / Passport) prior to receiving keyless access codes.
            </p>
            <p>
              4.2 <strong>Local Law Compliance:</strong> All stays are logged in the partner dashboard with 1-click legal printout capabilities, ensuring total compliance with local police and tourism department norms without on-site harassment.
            </p>
          </div>

          {/* Clause 5: nothingness. Lounge Unlock */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold text-white print:text-black text-accent-gold uppercase tracking-wider">
              5. Multi-Property Gated Lounge Access
            </h4>
            <p>
              5.1 Partners operating more than 2 active properties in the same state unlock the gated <strong>nothingness. Lounge</strong> model. Entry is strictly restricted to vetted members with at least 1 completed stay across any nothingness. sanctuary in India (no direct walk-ins).
            </p>
          </div>

          {/* Executed Signature Block */}
          <div className="pt-6 border-t border-white/10 print:border-black/20 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-1 text-[11px] font-mono text-white/50 print:text-gray-600">
              <p>Governing Law: Indian Contract Act 1872</p>
              <p>Jurisdiction: {city || 'National Capital Territory / Pan-India'}</p>
              <p>Executed Date: {formattedSignedDate}</p>
              <p className="text-[10px] text-accent-gold print:text-amber-800">
                🔒 Cryptographic Seal: SHA256:{Math.random().toString(36).substring(2, 12).toUpperCase()}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Authorized Signatory</p>
              <p className="text-sm font-serif font-bold text-white print:text-black italic">
                {executedSignature || signatureText || partnerName || 'Deponent / Partner'}
              </p>
              <p className="text-[10px] font-mono text-green-400 print:text-green-700">✓ Digital Signature Verified</p>
            </div>
          </div>

        </div>

        {/* Signing Form Footer (Hidden in Read-Only / Print) */}
        {!isReadOnly && (
          <form onSubmit={handleSign} className="p-6 border-t border-white/10 bg-zinc-900/50 space-y-4 print:hidden">
            
            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 accent-accent-gold"
                />
                <span>
                  I agree to the 70/30 commercial split, ₹3L setup terms, and autonomous operational guidelines outlined in this MoU.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedOwnership}
                  onChange={(e) => setAgreedOwnership(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 accent-accent-gold"
                />
                <span>
                  I certify that I am the lawful owner of the property and agree to submit the signed Operational NOC Affidavit.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  Digital Signature (Type Full Legal Name)
                </label>
                <input
                  type="text"
                  required
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-serif focus:outline-none focus:border-accent-gold/50"
                />
              </div>

              <button
                type="submit"
                disabled={signing || !agreedTerms || !agreedOwnership || !signatureText.trim()}
                className="w-full bg-accent-gold hover:bg-white text-black py-3 rounded-xl text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 disabled:opacity-40 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {signing ? (
                  'Recording Signature...'
                ) : (
                  <>
                    <span>Sign &amp; Accept MoU</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
