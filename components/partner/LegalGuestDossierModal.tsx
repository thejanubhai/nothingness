'use client';

import React, { useRef } from 'react';
import { ShieldCheck, Printer, X, FileText, CheckCircle2, User, Calendar, MapPin, Phone, Lock } from 'lucide-react';
import { format } from 'date-fns';

export interface BookingGuestDetail {
  id: string;
  bookingRef: string;
  propertyTitle: string;
  propertyAddress: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  docType: 'Aadhaar Card' | 'Passport' | 'Voter ID' | 'Driving License';
  docMaskedNumber: string;
  verificationToken: string;
  verifiedAt: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  purposeOfStay: string;
  complianceStatus: 'Statutory Verified' | 'Pre-Vetted (180-Day Pass)';
}

interface Props {
  booking: BookingGuestDetail | null;
  onClose: () => void;
}

export default function LegalGuestDossierModal({ booking, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Actions Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-gold" />
            <h3 className="font-serif text-sm sm:text-base text-white font-semibold">
              Legal Guest Verification Dossier
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-accent-gold hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-colors shadow-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Legal Copy</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 overflow-y-auto print:p-0 print:overflow-visible print:bg-white print:text-black">
          
          {/* Document Official Header */}
          <div className="border-b border-white/10 print:border-black/20 pb-4 flex justify-between items-start">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-gold print:text-amber-700">
                Statutory Hospitality &amp; Police Compliance
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl text-white print:text-black font-bold mt-1">
                Guest Verification Record
              </h1>
              <p className="text-xs text-white/50 print:text-gray-600 mt-0.5">
                Compliant with State Tourism, Homestay, and Local Police Online Verification Statutes
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:border-green-600 print:text-green-700">
                {booking.complianceStatus}
              </span>
              <p className="text-[10px] text-white/40 print:text-gray-500 mt-1.5 font-mono">
                Token: {booking.verificationToken}
              </p>
            </div>
          </div>

          {/* Property & Stay Overview */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 print:bg-gray-50 print:border-gray-200 text-xs">
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40 print:text-gray-500 tracking-wider">Sanctuary Space</p>
              <p className="font-semibold text-white print:text-black mt-0.5">{booking.propertyTitle}</p>
              <p className="text-[11px] text-white/60 print:text-gray-600 mt-0.5">{booking.propertyAddress}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40 print:text-gray-500 tracking-wider">Booking Reference</p>
              <p className="font-mono text-accent-gold print:text-amber-800 font-bold mt-0.5">{booking.bookingRef}</p>
              <p className="text-[11px] text-white/60 print:text-gray-600 mt-0.5">
                Check-in: {format(new Date(booking.checkIn), 'dd MMM yyyy')} &rarr; Check-out: {format(new Date(booking.checkOut), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {/* Guest Identity Dossier */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm uppercase tracking-wider text-white print:text-black font-semibold border-b border-white/5 print:border-gray-200 pb-2">
              Primary Verified Guest Particulars
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Full Legal Name</p>
                <p className="font-medium text-white print:text-black text-sm">{booking.guestName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">WhatsApp / Contact Phone</p>
                <p className="font-mono text-white print:text-black">{booking.guestPhone}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Email Address</p>
                <p className="text-white/80 print:text-black font-mono">{booking.guestEmail}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Document Type &amp; ID Mask</p>
                <p className="font-mono text-white print:text-black font-semibold">
                  {booking.docType}: {booking.docMaskedNumber}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Occupancy Count</p>
                <p className="text-white print:text-black">{booking.totalGuests} Registered Adult Guest(s)</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-mono text-white/40 print:text-gray-500">Verification Timestamp</p>
                <p className="text-white/70 print:text-gray-600 font-mono">{booking.verifiedAt}</p>
              </div>
            </div>
          </div>

          {/* Legal Compliance Declaration */}
          <div className="p-4 rounded-xl border border-white/10 print:border-gray-300 text-[11px] leading-relaxed text-white/60 print:text-gray-600 bg-white/[0.01] print:bg-white space-y-2">
            <p className="font-semibold text-white print:text-black flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-green-600" />
              <span>Statutory Compliance &amp; Non-Nuisance Undertaking</span>
            </p>
            <p>
              The primary guest identified above has completed digital identity authentication in compliance with applicable State Police and Homestay Registration protocols. The guest has agreed to strict zero-party rules, keyless entry logging, and non-commercial occupancy terms.
            </p>
          </div>

          {/* Signature & Verification Seal Block */}
          <div className="pt-6 border-t border-white/10 print:border-gray-300 flex justify-between items-end text-[10px] font-mono text-white/40 print:text-gray-500">
            <div>
              <p>Generated by nothingness. Partner OS</p>
              <p>Digital Cryptographic ID Hash: SHA256:{booking.verificationToken.slice(0, 16)}...</p>
            </div>
            <div className="text-right">
              <div className="w-32 border-b border-white/30 print:border-black mb-1" />
              <p>Authorized Partner Verification</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
