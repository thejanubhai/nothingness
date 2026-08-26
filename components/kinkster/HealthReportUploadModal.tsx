'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface HealthReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onVerified?: () => void | Promise<void>;
}

export default function HealthReportUploadModal({ isOpen, onClose, onSuccess, onVerified }: HealthReportUploadModalProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!filePreview) {
      toast.error('Please select a lab report file or photo.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kinkster/health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: filePreview })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process lab report');

      toast.success('Health Badges Updated Successfully!', {
        description: `Verified badges: ${data.health_badges.map((b: any) => b.title).join(', ')}`
      });

      if (onSuccess) onSuccess();
      if (onVerified) onVerified();
      onClose();
    } catch (err: any) {
      toast.error('Processing Failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Blood Test &amp; Diagnostic Upload</h3>
            <p className="text-xs text-zinc-400">Encrypted optical engine authenticates lab reports for dignified badges</p>
          </div>
        </div>

        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 mb-6 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>
            Lab reports are securely analyzed to extract diagnostic parameters (HIV 1/2, STI panel, Test Date) and generate non-discriminatory, respectful badges on your profile.
          </span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
        />

        {!filePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 bg-zinc-900/40 mb-6"
          >
            <UploadCloud className="w-8 h-8 text-zinc-500" />
            <p className="text-xs text-zinc-400">Upload Blood Test / Diagnostic Panel Report Photo</p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-40 rounded-2xl overflow-hidden border border-zinc-800 mb-6 cursor-pointer group"
          >
            <img src={filePreview} alt="Lab Report Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Change Report Photo</span>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !filePreview}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Authenticating Diagnostic Report...' : 'Verify & Add Discretion Badges'}
        </button>
      </div>
    </div>
  );
}
