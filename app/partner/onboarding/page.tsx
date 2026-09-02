'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import PartnerMouContractModal from '@/components/partner/PartnerMouContractModal';
import PropertyNocAffidavitModal from '@/components/partner/PropertyNocAffidavitModal';

function PartnerOnboardingContent() {
  const searchParams = useSearchParams();

  // Partner Particulars
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [state, setState] = useState('Delhi (NCT)');
  const [city, setCity] = useState('New Delhi');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [spaceTier, setSpaceTier] = useState<'budget' | 'luxury'>('luxury');
  const [carpetArea, setCarpetArea] = useState('1,100 sq ft');

  // Dynamic Fee from Admin
  const [setupFee, setSetupFee] = useState<number>(300000);

  // Step States
  const [setupFeePaid, setSetupFeePaid] = useState(false);
  const [mouSigned, setMouSigned] = useState(false);
  const [affidavitUploaded, setAffidavitUploaded] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<string>('pending_payment');
  const [paying, setPaying] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Modals
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [affidavitModalOpen, setAffidavitModalOpen] = useState(false);

  useEffect(() => {
    // Check if returning from PayU with payment=success
    const paymentStatus = searchParams?.get('payment');
    if (paymentStatus === 'success') {
      setSetupFeePaid(true);
      toast.success('Partner Setup Fee Paid via PayU!', {
        description: 'Your payment has been cryptographically confirmed. Please proceed to sign the MoU.',
      });
    } else if (paymentStatus === 'failed') {
      const errorMsg = searchParams?.get('error') || 'Payment could not be completed.';
      toast.error('PayU Payment Failed', { description: decodeURIComponent(errorMsg) });
    }

    // Fetch active fee and partner onboarding status
    async function loadStatus() {
      try {
        const res = await fetch('/api/partner/onboarding');
        const data = await res.json();
        
        if (data.fee !== undefined) {
          setSetupFee(data.fee);
        }
        if (data.setupFeePaid) {
          setSetupFeePaid(true);
        }
        if (data.mouSigned) {
          setMouSigned(true);
        }
        if (data.affidavitUploaded) {
          setAffidavitUploaded(true);
        }
        if (data.status) {
          setPartnerStatus(data.status);
        }

        if (data.user) {
          if (data.user.fullName && !partnerName) setPartnerName(data.user.fullName);
          if (data.user.email && !partnerEmail) setPartnerEmail(data.user.email);
          if (data.user.phone && !partnerPhone) setPartnerPhone(data.user.phone);
        }

        if (data.profile) {
          if (data.profile.full_name) setPartnerName(data.profile.full_name);
          if (data.profile.email) setPartnerEmail(data.profile.email);
          if (data.profile.phone) setPartnerPhone(data.profile.phone);
          if (data.profile.contract_city) setCity(data.profile.contract_city);
          if (data.profile.affidavit_notes) setPropertyAddress(data.profile.affidavit_notes);
        }

        if (data.properties && data.properties.length > 0) {
          const prop = data.properties[0];
          if (prop.city) setCity(prop.city);
          if (prop.state) setState(prop.state);
          if (prop.locality) setPropertyAddress(prop.locality);
          if (prop.space_tier) setSpaceTier(prop.space_tier);
          if (prop.carpet_area) setCarpetArea(prop.carpet_area);
        }
      } catch (err) {
        console.warn('Failed to load partner onboarding status:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadStatus();
  }, [searchParams]);

  const handlePaySetupFee = async () => {
    if (!partnerName.trim() || !partnerEmail.trim()) {
      toast.error('Please enter your full name and email before proceeding to payment.');
      return;
    }

    setPaying(true);
    try {
      const res = await fetch('/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate_setup_payment',
          partnerName,
          partnerEmail,
          partnerPhone,
          city,
          state,
          locality: propertyAddress,
          propertyAddress,
          spaceTier,
          carpetArea
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate onboarding fee');

      if (!data.requiresPayment) {
        setSetupFeePaid(true);
        toast.success('Zero-Fee Setup Verified', {
          description: 'Proceed to review and sign the 70/30 MoU agreement.'
        });
        return;
      }

      // Real PayU Dynamic Form Submission
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
      toast.info('Connecting to PayU Secure Payment Gateway...');
      form.submit();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment initiation failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleSignComplete = async (signatureData: { signedAt: string; signatureText: string; city: string }) => {
    try {
      const res = await fetch('/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign_mou',
          partnerName,
          partnerEmail,
          partnerPhone,
          city: signatureData.city || city,
          signatureText: signatureData.signatureText
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record MoU signature');
      }

      setMouSigned(true);
      toast.success('MoU Contract Logged Successfully', {
        description: 'Next: Print and upload your Property NOC Affidavit.'
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save signature');
    }
  };

  const handleUploadSuccess = () => {
    setAffidavitUploaded(true);
    setPartnerStatus('under_review');
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

      {/* Property & Host Particulars Form */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-gold" />
            <h3 className="font-serif text-base sm:text-lg text-white font-semibold">
              Host Partner &amp; Property Particulars
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase text-white/40">Step 0: Verification Info</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Full Legal Name</label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. Kabir Varma"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Email Address</label>
            <input
              type="email"
              required
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="partner@domain.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Mobile Phone</label>
            <input
              type="tel"
              value={partnerPhone}
              onChange={(e) => setPartnerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">State / Region</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            >
              <option value="Delhi (NCT)">Delhi (NCT)</option>
              <option value="Haryana">Haryana (Gurgaon)</option>
              <option value="Uttar Pradesh">Uttar Pradesh (Noida)</option>
              <option value="Maharashtra">Maharashtra (Mumbai / Pune)</option>
              <option value="Karnataka">Karnataka (Bengaluru)</option>
              <option value="Goa">Goa</option>
              <option value="Other State">Other State</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">City / District</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. New Delhi"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Locality / Property Address</label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g. A-42 Hauz Khas Enclave"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
            />
          </div>
        </div>
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

            <h3 className="font-serif text-xl text-white">
              {setupFee > 0 ? `₹${setupFee.toLocaleString('en-IN')} Setup Fee` : 'Zero-Fee Onboarding'}
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              PAN India operational setup covering smart keyless hardware, vendor supply chain, parking/valet logistics, and statutory ID registry.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            {setupFeePaid ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-center text-xs font-mono font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Confirmed</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={paying}
                onClick={handlePaySetupFee}
                className="w-full bg-accent-gold hover:bg-white text-black py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {paying ? 'Connecting...' : setupFee > 0 ? `Pay ₹${setupFee.toLocaleString('en-IN')} via PayU` : 'Confirm Free Setup'}
                </span>
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
              Legally valid franchise contract governed under Indian Contract Act 1872 &amp; local hospitality norms, locking in the 70/30 commercial split.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            {mouSigned ? (
              <button
                type="button"
                onClick={() => setMouModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-center text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Executed MoU</span>
              </button>
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
              <button
                type="button"
                onClick={() => setAffidavitModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-center text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Affidavit Under Review</span>
              </button>
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
              Your setup fee, signed MoU, and property NOC affidavit are logged in Supabase. Your hyper-personalised Partner Dashboard is now accessible.
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
        isReadOnly={mouSigned}
      />

      {/* Property NOC Affidavit Modal */}
      <PropertyNocAffidavitModal
        partnerName={partnerName}
        propertyAddress={propertyAddress}
        city={city}
        state={state}
        spaceTier={spaceTier}
        carpetArea={carpetArea}
        isOpen={affidavitModalOpen}
        onClose={() => setAffidavitModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        isReadOnly={affidavitUploaded}
      />

    </main>
  );
}

export default function PartnerOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-white/40 font-mono text-xs">Loading Partner Onboarding...</div>}>
      <PartnerOnboardingContent />
    </Suspense>
  );
}
