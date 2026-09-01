'use client';

import React, { useState } from 'react';
import { FileText, Printer, Upload, CheckCircle2, ShieldCheck, X, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  partnerName: string;
  propertyAddress: string;
  city: string;
  state?: string;
  spaceTier?: 'budget' | 'luxury';
  carpetArea?: string;
  propertyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (fileUrl: string) => void;
  isReadOnly?: boolean;
  uploadedAffidavitUrl?: string;
}

export default function PropertyNocAffidavitModal({
  partnerName,
  propertyAddress,
  city,
  state = 'Delhi (NCT)',
  spaceTier = 'luxury',
  carpetArea = '1,100 sq ft',
  propertyTitle,
  isOpen,
  onClose,
  onUploadSuccess,
  isReadOnly = false,
  uploadedAffidavitUrl
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handlePrintTemplate = () => {
    window.print();
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select the scanned signed affidavit file.');
      return;
    }

    setUploading(true);
    try {
      // Simulate/Generate persistent document URI
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const docUrl = `https://storage.nothingness.asia/affidavits/${Date.now()}_${sanitizedFileName}`;
      
      const res = await fetch('/api/partner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_affidavit',
          affidavitUrl: docUrl,
          fileName: file.name,
          partnerName,
          propertyAddress,
          city,
          state,
          spaceTier,
          carpetArea,
          propertyTitle
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload submission failed.');

      if (onUploadSuccess) {
        onUploadSuccess(docUrl);
      }
      toast.success('Affidavit Uploaded Successfully', {
        description: 'Your document is logged and queued for manual verification by the nothingness admin team.'
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload affidavit. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:max-h-none print:w-full print:bg-white print:text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/40 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-gold" />
            <div>
              <h3 className="font-serif text-base sm:text-lg text-white font-semibold">
                Operational NOC &amp; Ownership Affidavit
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                Mandatory Property Verification for nothingness. Sanctuaries
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

        {/* Content Area */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto text-xs text-white/80 leading-relaxed max-h-[60vh] print:p-0 print:overflow-visible print:bg-white print:text-black print:max-h-none">
          
          {/* Print Action Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-white font-bold text-sm font-serif">1. Print Standardized Affidavit Template</p>
              <p className="text-white/50 text-[11px]">Print this pre-filled legal draft, sign/notarize on non-judicial stamp paper.</p>
            </div>
            <button
              type="button"
              onClick={handlePrintTemplate}
              className="flex items-center gap-2 bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Draft Template</span>
            </button>
          </div>

          {/* Printable Affidavit Text */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 print:border-none print:bg-white space-y-4 font-serif text-[11px] leading-relaxed">
            <div className="text-center pb-3 border-b border-white/10 print:border-black">
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent-gold print:text-black font-bold">
                AFFIDAVIT &amp; OPERATIONAL NO-OBJECTION UNDERTAKING
              </p>
              <p className="text-xs font-bold text-white print:text-black mt-1">
                BEFORE THE COMPETENT NOTARY PUBLIC / OATH COMMISSIONER
              </p>
            </div>

            <p>
              I, <strong>{partnerName || '[Full Legal Name of Property Owner]'}</strong>, residing at the address registered with nothingness., do hereby solemnly affirm and state on oath as follows:
            </p>

            <p>
              1. That I am the absolute, lawful, and undisputed registered owner in physical possession of the residential real estate unit situated at: <br />
              <strong className="font-mono text-accent-gold print:text-black">{propertyAddress || '[Complete Registered Property Address]'}, {city || '[City]'}, {state || '[State]'}</strong>.
            </p>

            <p>
              2. That I have full legal right, title, and authority to permit the operation of a high-yield private sanctuary under the brand and autonomous operating guidelines of <strong>nothingness.</strong>.
            </p>

            <p>
              3. That the premise is free from any legal encumbrance, sublet prohibition, or litigation that would prevent autonomous, keyless residential guest stays.
            </p>

            <p>
              4. That all guests staying at this property will be verified in accordance with applicable State Police, homestay registration, and statutory ID authentication norms.
            </p>

            <div className="pt-8 flex justify-between items-end">
              <div>
                <p className="font-mono text-[10px]">Date: ____________________</p>
                <p className="font-mono text-[10px] mt-1">Place: {city || '________________'}</p>
              </div>
              <div className="text-right">
                <div className="w-40 border-b border-white/40 print:border-black mb-1" />
                <p className="font-bold">DEPONENT / PROPERTY OWNER</p>
                <p className="text-[9px] font-mono text-white/50 print:text-black">(Sign in presence of Notary)</p>
              </div>
            </div>
          </div>

          {/* View Already Uploaded Document */}
          {isReadOnly && uploadedAffidavitUrl && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 print:hidden">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Affidavit Document on File</span>
              </div>
              <p className="text-[11px] text-white/70">
                A signed and notarized affidavit scan has been submitted for this partner property.
              </p>
              <a
                href={uploadedAffidavitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent-gold hover:underline font-mono"
              >
                <span>View Stored Document Link</span> &rarr;
              </a>
            </div>
          )}

          {/* Upload Section (Hidden in Print / Read-Only) */}
          {!isReadOnly && (
            <div className="print:hidden space-y-4 pt-2">
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-bold text-sm font-serif">2. Upload Signed &amp; Notarized Scan</p>
                <p className="text-white/50 text-[11px] mt-0.5">
                  Upload your signed affidavit (PDF, JPG, PNG). Our system will log the document for <strong>Manual Admin Verification</strong>.
                </p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="border-2 border-dashed border-white/15 hover:border-accent-gold/40 rounded-2xl p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="affidavit_file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="affidavit_file" className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-accent-gold mx-auto" />
                    {file ? (
                      <p className="text-xs text-emerald-400 font-mono font-semibold">{file.name} selected</p>
                    ) : (
                      <div>
                        <p className="text-xs text-white font-medium">Click to select signed affidavit scan</p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">Supported: PDF, JPG, PNG (Max 15MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-[11px] text-white/60">
                  <Lock className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                  <span>
                    All submitted property deeds and affidavits are securely stored and verified manually by the nothingness Compliance &amp; Admin team before property go-live.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-accent-gold hover:bg-white text-black py-3.5 rounded-xl text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 disabled:opacity-40 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? 'Uploading & Processing...' : 'Submit Affidavit for Verification'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
