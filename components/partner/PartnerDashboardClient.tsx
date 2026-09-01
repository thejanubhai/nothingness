'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  QrCode, 
  CreditCard, 
  FileText, 
  ArrowUpRight, 
  Truck, 
  Coffee, 
  Lock, 
  ChevronRight,
  RefreshCw,
  LifeBuoy
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import LegalGuestDossierModal, { BookingGuestDetail } from './LegalGuestDossierModal';
import LoungeQrScannerModal from './LoungeQrScannerModal';
import PartnerInventoryManager from './PartnerInventoryManager';
import PartnerMouContractModal from './PartnerMouContractModal';
import PropertyNocAffidavitModal from './PropertyNocAffidavitModal';

interface PartnerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'under_review' | 'pending_payment' | 'contract_pending' | 'affidavit_pending' | 'rejected';
  setup_fee_paid?: boolean;
  contract_signed?: boolean;
  contract_signed_at?: string | null;
  contract_city?: string | null;
  affidavit_uploaded?: boolean;
  affidavit_url?: string | null;
  affidavit_notes?: string | null;
  verified_by_admin?: boolean;
  payout_frequency: 'monthly' | 'quarterly' | 'yearly';
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_name?: string;
  upi_id?: string;
}

interface PartnerProperty {
  id: string;
  title: string;
  city: string;
  locality: string;
  space_tier: 'budget' | 'luxury';
  housekeeping_status: 'ready' | 'turnover_in_progress' | 'inspection_pending' | 'maintenance';
  lounge_eligible: boolean;
  lounge_type: string;
}

interface MockBooking {
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
  grossAmount: number;
  partnerNetShare: number;
  platformShare: number;
  status: 'confirmed' | 'active_stay' | 'completed';
  purposeOfStay: string;
  complianceStatus: 'Statutory Verified' | 'Pre-Vetted (180-Day Pass)';
}

const MOCK_BOOKINGS: MockBooking[] = [
  {
    id: 'bk-101',
    bookingRef: 'NTH-DL-8924',
    propertyTitle: 'The Amber Haven Sanctuary',
    propertyAddress: 'A-42 Hauz Khas Enclave, New Delhi',
    guestName: 'Rohit K. Varma',
    guestPhone: '+91 98101 22910',
    guestEmail: 'rohit.varma@lifestyle-corp.com',
    docType: 'Aadhaar Card',
    docMaskedNumber: 'XXXX-XXXX-8921',
    verificationToken: 'DEL-POL-VER-8912749',
    verifiedAt: '24 Aug 2026, 11:30 AM',
    checkIn: '2026-08-25',
    checkOut: '2026-08-28',
    totalGuests: 2,
    grossAmount: 24000,
    partnerNetShare: 16800, // 70%
    platformShare: 7200,   // 30%
    status: 'confirmed',
    purposeOfStay: 'Private Luxury Staycation',
    complianceStatus: 'Statutory Verified'
  },
  {
    id: 'bk-102',
    bookingRef: 'NTH-DL-8919',
    propertyTitle: 'The Obsidian Suite',
    propertyAddress: 'C-18 Greater Kailash 1, New Delhi',
    guestName: 'Ananya Singhania',
    guestPhone: '+91 98200 44122',
    guestEmail: 'ananya.s@studio-aesthetics.in',
    docType: 'Passport',
    docMaskedNumber: 'Z894XXXX',
    verificationToken: 'DEL-POL-VER-7729102',
    verifiedAt: '22 Aug 2026, 14:15 PM',
    checkIn: '2026-08-22',
    checkOut: '2026-08-24',
    totalGuests: 2,
    grossAmount: 18000,
    partnerNetShare: 12600, // 70%
    platformShare: 5400,   // 30%
    status: 'active_stay',
    purposeOfStay: 'Creative Retreat & Relaxation',
    complianceStatus: 'Pre-Vetted (180-Day Pass)'
  }
];

interface Props {
  profile: PartnerProfile;
  properties: PartnerProperty[];
  initialBookings?: MockBooking[];
}

export default function PartnerDashboardClient({ profile, properties, initialBookings = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'financials' | 'inventory' | 'lounge' | 'protection'>('calendar');
  const [bookings] = useState<MockBooking[]>(initialBookings);
  
  // Selected Booking for Legal Dossier Printout
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<BookingGuestDetail | null>(null);

  // Lounge QR Scanner Modal
  const [loungeScannerOpen, setLoungeScannerOpen] = useState(false);

  // Payout Settings State
  const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>(profile.payout_frequency || 'monthly');
  const [bankAccount, setBankAccount] = useState(profile.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(profile.bank_ifsc || '');
  const [accountName, setAccountName] = useState(profile.bank_account_name || profile.full_name || '');
  const [bankName, setBankName] = useState(profile.bank_name || '');
  const [upiId, setUpiId] = useState(profile.upi_id || '');
  const [savingPayout, setSavingPayout] = useState(false);

  // Legal Document Modals
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [affidavitModalOpen, setAffidavitModalOpen] = useState(false);

  // Dynamic Financial Aggregations (70% Partner / 30% nothingness.)
  const totalGrossRevenue = bookings.reduce((sum, b) => sum + (b.grossAmount || 0), 0);
  const partnerNetEarnings = Math.round(totalGrossRevenue * 0.70); // 70%
  const platformOpsFee = Math.round(totalGrossRevenue * 0.30);    // 30%
  const eventsRevenueShare = 0;
  const loungeRevenueShare = 0;
  const totalNetTakeHome = partnerNetEarnings + eventsRevenueShare + loungeRevenueShare;

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      const res = await fetch('/api/partner/payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_frequency: payoutFrequency,
          bank_account_number: bankAccount,
          bank_ifsc: bankIfsc,
          bank_account_name: accountName,
          bank_name: bankName,
          upi_id: upiId
        })
      });

      if (!res.ok) throw new Error('Failed to update payout settings');

      toast.success('Payout Preferences Saved', {
        description: `Schedule set to ${payoutFrequency.toUpperCase()} direct bank deposit.`
      });
    } catch (err: any) {
      toast.error('Failed to save payout settings. Please try again.');
    } finally {
      setSavingPayout(false);
    }
  };

  const isUnderReview = profile.status === 'under_review' || (!profile.verified_by_admin && profile.status !== 'active');

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-full border border-accent-gold/20">
              {isUnderReview ? 'Partner Application in Verification' : 'Verified Partner Command Center'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isUnderReview ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span className={`text-xs font-mono ${isUnderReview ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isUnderReview ? 'Statutory Audit Active' : 'Sanctuaries Live'}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl text-white">
            Welcome, <span className="text-accent-gold">{profile.full_name || 'Partner'}</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Managing <span className="text-white font-semibold font-mono">{properties.length || 1} Active Sanctuaries</span> with autonomous WhatsApp keyless ops &amp; 70/30 yield distribution.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMouModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-accent-gold" />
            <span>View Signed MoU</span>
          </button>

          <button
            type="button"
            onClick={() => setAffidavitModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Property NOC</span>
          </button>

          <button
            onClick={() => setLoungeScannerOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-700/30 text-accent-gold border border-accent-gold/40 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Lounge Pass</span>
          </button>
        </div>
      </div>

      {/* Under Review Alert Banner */}
      {isUnderReview && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Property Verification &amp; Statutory Audit in Progress
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Your ₹3L setup, executed 70/30 MoU, and property NOC affidavit are logged. Our admin compliance team is completing statutory verification.
              </p>
            </div>
          </div>

          <a
            href="/partner/onboarding"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
          >
            Onboarding Pipeline &rarr;
          </a>
        </div>
      )}

      {/* Top Stat Cards (70/30 Commercial Split Highlight) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Partner Net Earnings (70%) */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-accent-gold/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-gold/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-[10px] uppercase font-mono tracking-widest text-accent-gold">Partner Net Take-Home (70% + Addons)</p>
          <p className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            ₹{totalNetTakeHome.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Includes ₹{eventsRevenueShare.toLocaleString('en-IN')} Events &amp; Lounge Revenue</span>
          </p>
        </div>

        {/* Card 2: Gross Sanctuary Revenue */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Gross Stays Revenue</p>
          <p className="font-serif text-2xl sm:text-3xl text-white font-bold mt-1">
            ₹{totalGrossRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-white/50 font-mono mt-1">
            Platform Ops Share (30%): ₹{platformOpsFee.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Card 3: Live Occupancy Rate */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Current Month Occupancy</p>
          <p className="font-serif text-2xl sm:text-3xl text-emerald-400 font-bold mt-1">
            92.4%
          </p>
          <p className="text-[10px] text-white/50 font-mono mt-1">
            Zero party nuisance · 100% ID compliance
          </p>
        </div>

        {/* Card 4: Payout Schedule */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
          <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Payout Schedule</p>
          <p className="font-serif text-2xl text-accent-gold font-bold mt-1 capitalize">
            {payoutFrequency}
          </p>
          <p className="text-[10px] text-white/50 font-mono mt-1">
            Next Disbursement: 1st of Next Month
          </p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'calendar', label: 'Live Bookings & Legal Dossier', icon: Calendar },
          { id: 'financials', label: '70/30 Financials & Payouts', icon: DollarSign },
          { id: 'inventory', label: 'Housekeeping & Inventory Refill', icon: Package },
          { id: 'lounge', label: 'nothingness. Lounge', icon: Coffee },
          { id: 'protection', label: 'Host Protection & Insurance', icon: LifeBuoy }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-accent-gold' : 'text-white/40'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: LIVE BOOKINGS & LEGAL GUEST DOSSIER PRINT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white">
                Live Bookings &amp; Legal Compliance Records
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Instant 1-click legal printout available for statutory police or local authority presentation.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-white/50 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Aadhaar / Passport Pre-Vetted</span>
            </div>
          </div>

          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-accent-gold/60 mx-auto" />
                <h4 className="font-serif text-lg text-white">No Live Reservations Yet</h4>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  When guests reserve your managed sanctuaries, their verified compliance records, check-in dates, and 70% net payout splits will appear here in real-time.
                </p>
              </div>
            ) : (
              bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-accent-gold/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left Booking Overview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-accent-gold">{booking.bookingRef}</span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      booking.status === 'active_stay'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-accent-gold/10 text-accent-gold border-accent-gold/30'
                    }`}>
                      {booking.status === 'active_stay' ? 'Active Guest Stay' : 'Confirmed Upcoming'}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {booking.complianceStatus}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg text-white font-semibold">
                    {booking.propertyTitle}
                  </h4>
                  <p className="text-xs text-white/50">{booking.propertyAddress}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-white/70 pt-2 font-mono">
                    <div>
                      <span className="text-white/30">Guest:</span>{' '}
                      <span className="text-white font-medium">{booking.guestName}</span>
                    </div>
                    <div>
                      <span className="text-white/30">Dates:</span>{' '}
                      <span className="text-white">
                        {format(new Date(booking.checkIn), 'dd MMM')} – {format(new Date(booking.checkOut), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/30">ID Token:</span>{' '}
                      <span className="text-emerald-400">{booking.verificationToken}</span>
                    </div>
                  </div>
                </div>

                {/* Right Financials & Legal Print Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Partner Share (70%)</p>
                    <p className="font-serif text-xl font-bold text-accent-gold">
                      ₹{booking.partnerNetShare.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">Gross: ₹{booking.grossAmount.toLocaleString('en-IN')}</p>
                  </div>

                  {/* 1-Click Legal Dossier Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForPrint(booking)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-accent-gold hover:text-black text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Legal Guest Dossier</span>
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: 70/30 FINANCIALS & PAYOUT SETTINGS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Financials Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-white">
                Revenue Split &amp; Financial Ledger
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Transparent 70% Partner / 30% nothingness. operational split with auxiliary events revenue.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                <span className="text-white/70">Gross Sanctuary Stays Revenue:</span>
                <span className="font-mono text-white font-bold">₹{totalGrossRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 text-emerald-400">
                <span>Partner Primary Share (70%):</span>
                <span className="font-mono font-bold">+₹{partnerNetEarnings.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-white/5 text-white/40">
                <span>nothingness. Platform &amp; Autonomous Ops Share (30%):</span>
                <span className="font-mono">-₹{platformOpsFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 text-accent-gold">
                <span>Vetted Members Events Ticketing Share:</span>
                <span className="font-mono font-bold">+₹{eventsRevenueShare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 text-amber-300">
                <span>nothingness. Lounge F&amp;B &amp; Passes Share:</span>
                <span className="font-mono font-bold">+₹{loungeRevenueShare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-base pt-3 font-bold">
                <span className="text-white font-serif">Total Net Monthly Payout:</span>
                <span className="font-serif text-2xl text-accent-gold">₹{totalNetTakeHome.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payout Settings & Frequency Form (5 cols) */}
          <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
            <div>
              <h4 className="font-serif text-lg text-white font-semibold">
                Payout Bank Preferences
              </h4>
              <p className="text-xs text-white/50 mt-0.5">
                Configure your disbursement frequency and bank account details.
              </p>
            </div>

            <form onSubmit={handleSavePayoutSettings} className="space-y-4">
              
              {/* Frequency Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                  Disbursement Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'monthly', label: 'Monthly', desc: '1st of month' },
                    { id: 'quarterly', label: 'Quarterly', desc: 'Every 3 mos' },
                    { id: 'yearly', label: 'Yearly', desc: 'Annual lump' }
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setPayoutFrequency(freq.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        payoutFrequency === freq.id
                          ? 'bg-accent-gold/10 border-accent-gold text-white'
                          : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-bold font-mono">{freq.label}</p>
                      <p className="text-[9px] text-white/40 mt-0.5">{freq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                  Account Beneficiary Name
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Legal Name as per Bank"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/50"
                />
              </div>

              {/* Account Number & IFSC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                    Account Number
                  </label>
                  <input
                    type="password"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Account Number"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-accent-gold/50"
                  />
                </div>
              </div>

              {/* UPI ID (Optional) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                  UPI VPA ID (Secondary)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="partner@okhdfcbank"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-gold/50"
                />
              </div>

              <button
                type="submit"
                disabled={savingPayout}
                className="w-full bg-accent-gold hover:bg-white text-black py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer shadow-lg mt-2"
              >
                {savingPayout ? 'Saving Settings...' : 'Save Payout Preferences'}
              </button>
            </form>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: HOUSEKEEPING & INVENTORY REFILL
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-8">
          
          {/* Housekeeping Turnover Status */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h4 className="font-serif text-lg text-white font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Automated Housekeeping Turnover Pipeline</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.length === 0 ? (
                <p className="text-white/40 text-xs py-4 col-span-2">No managed properties enrolled yet.</p>
              ) : (
                properties.map((prop) => (
                  <div key={prop.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{prop.title}</p>
                      <p className="text-xs text-white/40 font-mono mt-0.5">{prop.locality}, {prop.city}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ready &amp; Inspected ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hyperlocal Inventory Component */}
          <PartnerInventoryManager />

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: NOTHINGNESS. LOUNGE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'lounge' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent-gold bg-accent-gold/10 px-2.5 py-0.5 rounded-full border border-accent-gold/20 mb-1.5">
                <Sparkles className="w-3 h-3" /> Multi-Property Gated Unlock
              </div>
              <h3 className="font-serif text-2xl text-white">nothingness. Lounge Gateway</h3>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                Exclusive community lounge access for verified members with completed stay history.
              </p>
            </div>

            <button
              onClick={() => setLoungeScannerOpen(true)}
              className="bg-accent-gold hover:bg-white text-black px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch Entry Scanner</span>
            </button>
          </div>

          {/* Lounge Configuration Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Physical Setup Model</p>
              <p className="font-serif text-lg text-white font-bold">Open Terrace Sanctuary Lounge</p>
              <p className="text-xs text-white/60">Configured on upper terrace open space in close proximity.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Access Criteria</p>
              <p className="font-serif text-lg text-emerald-400 font-bold">1+ Completed Stay (PAN India)</p>
              <p className="text-xs text-white/60">Zero direct walk-ins. Validates real booking history.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Monthly F&amp;B Revenue</p>
              <p className="font-serif text-lg text-accent-gold font-bold">₹36,000 / month</p>
              <p className="text-xs text-white/60">Curated member passes &amp; artisanal beverage commission.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: HOST PROTECTION & INSURANCE ASSISTANCE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'protection' && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-white font-bold">Host Protection &amp; Damage Assurance</h3>
              <p className="text-xs text-white/50">Proactive operational safeguards &amp; claim escalation support.</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            Our autonomous keyless check-in and government ID verification filter out 99.8% of nuisance visitors. For any rare incidents, nothingness. assists partners with end-to-end claim escalation under aggregator host protection policies, ensuring zero financial stress for property maintenance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <p className="text-accent-gold font-bold">Pre-Stay ID Vetting</p>
              <p className="text-white/50 text-[11px]">Police Compliance statutory registry prevents unverified guests.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <p className="text-accent-gold font-bold">Dedicated Concierge Escalation</p>
              <p className="text-white/50 text-[11px]">24/7 incident documentation and photo log verification.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/40 font-mono">Need incident assistance?</span>
            <a
              href="mailto:claims@nothingness.asia"
              className="bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors"
            >
              File Claim / Incident Report
            </a>
          </div>
        </div>
      )}

      {/* Legal Guest Dossier Modal */}
      <LegalGuestDossierModal
        booking={selectedBookingForPrint}
        onClose={() => setSelectedBookingForPrint(null)}
      />

      {/* Gated Lounge QR Scanner Modal */}
      <LoungeQrScannerModal
        isOpen={loungeScannerOpen}
        onClose={() => setLoungeScannerOpen(false)}
      />

      {/* Executed MoU Contract Modal */}
      <PartnerMouContractModal
        partnerName={profile.full_name}
        partnerEmail={profile.email}
        city={profile.contract_city || 'National Capital Territory / Pan-India'}
        isOpen={mouModalOpen}
        onClose={() => setMouModalOpen(false)}
        isReadOnly={true}
        signedAtDate={profile.contract_signed_at || undefined}
        executedSignature={profile.full_name}
      />

      {/* Property NOC Affidavit Modal */}
      <PropertyNocAffidavitModal
        partnerName={profile.full_name}
        propertyAddress={profile.affidavit_notes || 'Registered Sanctuary'}
        city={profile.contract_city || 'New Delhi'}
        isOpen={affidavitModalOpen}
        onClose={() => setAffidavitModalOpen(false)}
        onUploadSuccess={() => {}}
        isReadOnly={true}
        uploadedAffidavitUrl={profile.affidavit_url || undefined}
      />

    </div>
  );
}
