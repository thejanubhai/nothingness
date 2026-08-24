'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Upload, 
  ArrowRight, 
  Lock, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import PartnerMouContractModal from '@/components/partner/PartnerMouContractModal';
import PropertyNocAffidavitModal from '@/components/partner/PropertyNocAffidavitModal';

export default function PartnerOnboardingPage() {
  const [partnerName, setPartnerName] = useState('Partner Principal');
  const [partnerEmail, setPartnerEmail] = useState('partner@nothingness.asia');
  const [city, setCity] = useState('New Delhi');
  const [propertyAddress, setPropertyAddress] = useState('A-42 Hauz Khas Enclave');

  // Step States
  const [setupFeePaid, setSetupFeePaid] = useState(false);
  const [mouSigned, setMouSigned] = useState(false);
  const [affidavitUploaded, setAffidavitUploaded] = useState(false);
  const [paying, setPaying] = useState(false);

  // Modals
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [affidavitModalOpen, setAffidavitModalOpen] = useState(false);

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_setup_fee' })
      });
      const data = await res.json();
      setSetupFeePaid(true);
      toast.success('₹3,00,000 Setup Fee Recorded', {
        description: 'PAN India operational onboarding fee received. Proceed to sign the MoU.'
      });
    } catch (err) {
      toast.error('Payment simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleSignComplete = () => {
    setMouSigned(true);
  };

  const handleUploadSuccess = () => {
    setAffidavitUploaded(true);
  };

  const allCompleted = setupFeePaid && mouSigned && affidavitUploaded;

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Partner Verification &amp; Activation Pipeline</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-white">
          Onboard Your <span className="text-accent-gold italic">Sanctuary</span>
        </h1>
        <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
          Complete the 3-step compliance onboarding to activate your hyper-personalised Partner Dashboard, live booking calendar, and 70/30 revenue distribution.
        </p>
      </div>

      {/* 3-Step Wizard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Step 1: Setup Fee */}
        <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          setupFeePaid
            ? 'bg-emerald-500/[0.04] border-emerald-500/30'
            : 'bg-white/[0.02] border-white/10'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                Step 01
              </span>
              {setupFeePaid ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <Clock className="w-3.5 h-3.5" /> Required
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl text-white">₹3 Lakhs Setup Fee</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              PAN India operational setup covering smart keyless hardware, local vendor integrations, valet/parking setup, and statutory ID registry.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            {setupFeePaid ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-center text-xs font-mono font-bold">
                ✓ Payment Logged
              </div>
            ) : (
              <button
                type="button"
                disabled={paying}
                onClick={handleSimulatePayment}
                className="w-full bg-accent-gold hover:bg-white text-black py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{paying ? 'Processing...' : 'Pay ₹3,00,000 Setup'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 2: MoU Contract */}
        <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          mouSigned
            ? 'bg-emerald-500/[0.04] border-emerald-500/30'
            : setupFeePaid
            ? 'bg-white/[0.02] border-white/10'
            : 'bg-white/[0.01] border-white/5 opacity-50'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                Step 02
              </span>
              {mouSigned ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl text-white">70/30 MoU Agreement</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Legally valid franchise draft governed under Indian Contract Act 1872 &amp; local city hospitality norms, locking in the 70/30 commercial split.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            {mouSigned ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-center text-xs font-mono font-bold">
                ✓ Agreement Executed
              </div>
            ) : (
              <button
                type="button"
                disabled={!setupFeePaid}
                onClick={() => setMouModalOpen(true)}
                className="w-full bg-white/10 hover:bg-white hover:text-black text-white py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Review &amp; Sign MoU</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Property Ownership & NOC Affidavit */}
        <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          affidavitUploaded
            ? 'bg-emerald-500/[0.04] border-emerald-500/30'
            : mouSigned
            ? 'bg-white/[0.02] border-white/10'
            : 'bg-white/[0.01] border-white/5 opacity-50'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-md border border-accent-gold/20">
                Step 03
              </span>
              {affidavitUploaded ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <Clock className="w-3.5 h-3.5" /> Mandatory
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl text-white">NOC Affidavit Upload</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Mandatory property ownership proof. Print our generated affidavit draft, notarize on stamp paper, and upload for <strong>Manual Admin Verification</strong>.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            {affidavitUploaded ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-center text-xs font-mono font-bold">
                ✓ Affidavit Under Review
              </div>
            ) : (
              <button
                type="button"
                disabled={!mouSigned}
                onClick={() => setAffidavitModalOpen(true)}
                className="w-full bg-white/10 hover:bg-white hover:text-black text-white py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Print &amp; Upload NOC</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Activation Status Banner */}
      <div className={`p-8 rounded-3xl border transition-all text-center space-y-4 ${
        allCompleted
          ? 'bg-accent-gold/[0.04] border-accent-gold/40 shadow-2xl'
          : 'bg-white/[0.02] border-white/10'
      }`}>
        {allCompleted ? (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-2xl text-white font-bold">
              All Onboarding Stages Completed!
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Your ₹3L setup fee, signed MoU, and property NOC affidavit are logged. Your hyper-personalised Partner Dashboard is now accessible.
            </p>
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 bg-accent-gold hover:bg-white text-black px-8 py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-xl"
            >
              <span>Access Partner Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-w-md mx-auto">
            <p className="font-serif text-lg text-white">Complete Steps Above to Unlock Dashboard</p>
            <p className="text-xs text-white/50">
              Upon submitting your notarized NOC affidavit, your documents undergo statutory audit followed by manual verification from the nothingness admin team.
            </p>
          </div>
        )}
      </div>

      {/* MoU Modal */}
      <PartnerMouContractModal
        partnerName={partnerName}
        partnerEmail={partnerEmail}
        city={city}
        isOpen={mouModalOpen}
        onClose={() => setMouModalOpen(false)}
        onSignComplete={handleSignComplete}
      />

      {/* Property NOC Affidavit Modal */}
      <PropertyNocAffidavitModal
        partnerName={partnerName}
        propertyAddress={propertyAddress}
        city={city}
        isOpen={affidavitModalOpen}
        onClose={() => setAffidavitModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

    </main>
  );
}
