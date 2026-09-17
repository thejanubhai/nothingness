'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Trash2, 
  Check, 
  X, 
  RefreshCw,
  TrendingUp,
  MapPin,
  Coffee,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminMetricCard from '@/components/admin/ui/AdminMetricCard';
import PartnerMouContractModal from '@/components/partner/PartnerMouContractModal';
import PropertyNocAffidavitModal from '@/components/partner/PropertyNocAffidavitModal';

interface FranchiseLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_location: string | null;
  investment_budget: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  created_at: string;
}

interface PartnerProperty {
  id: string;
  partner_id: string;
  title: string;
  state: string;
  city: string;
  locality: string;
  carpet_area: string | null;
  space_tier: 'budget' | 'luxury';
  ownership_confirmed: boolean;
  lounge_eligible: boolean;
  lounge_type: string;
  housekeeping_status: string;
  created_at: string;
  partner_profiles?: any;
}

interface PartnerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending_payment' | 'contract_pending' | 'affidavit_pending' | 'under_review' | 'active' | 'rejected';
  setup_fee_paid: boolean;
  setup_fee_tx_id: string | null;
  contract_signed: boolean;
  contract_signed_at: string | null;
  contract_city: string | null;
  affidavit_uploaded: boolean;
  affidavit_url: string | null;
  affidavit_notes: string | null;
  verified_by_admin: boolean;
  verified_at: string | null;
  payout_frequency: 'monthly' | 'quarterly' | 'yearly';
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_account_name: string | null;
  upi_id: string | null;
  created_at: string;
  partner_properties?: PartnerProperty[];
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  activePartners: number;
  pendingVerification: number;
  paidSetupCount: number;
  totalSetupRevenue: number;
}

interface Props {
  initialLeads: FranchiseLead[];
  initialPartners: PartnerProfile[];
  initialProperties: PartnerProperty[];
  initialStats: Stats;
}

export default function AdminPartnersClient({
  initialLeads,
  initialPartners,
  initialProperties,
  initialStats
}: Props) {
  const [activeTab, setActiveTab] = useState<'leads' | 'partners' | 'properties' | 'financials'>('leads');
  const [leads, setLeads] = useState<FranchiseLead[]>(initialLeads);
  const [partners, setPartners] = useState<PartnerProfile[]>(initialPartners);
  const [properties, setProperties] = useState<PartnerProperty[]>(initialProperties);
  const [stats, setStats] = useState<Stats>(initialStats);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals for Viewing Legal Documents
  const [selectedPartnerForMou, setSelectedPartnerForMou] = useState<PartnerProfile | null>(null);
  const [selectedPartnerForAffidavit, setSelectedPartnerForAffidavit] = useState<PartnerProfile | null>(null);

  // Update Franchise Lead Status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead',
          id: leadId,
          status: newStatus
        })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
      toast.success('Lead status updated', { description: `Marked as ${newStatus}` });
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this franchise lead?')) return;
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/admin/partners?type=lead&id=${leadId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');

      setLeads(prev => prev.filter(l => l.id !== leadId));
      toast.success('Lead deleted');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setUpdatingId(null);
    }
  };

  // Update Partner Verification
  const handleVerifyPartner = async (partnerId: string, isApproved: boolean) => {
    setUpdatingId(partnerId);
    try {
      const newStatus = isApproved ? 'active' : 'rejected';
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner',
          id: partnerId,
          status: newStatus,
          verified_by_admin: isApproved
        })
      });

      if (!res.ok) throw new Error('Failed to update verification status');

      setPartners(prev => prev.map(p => p.id === partnerId ? {
        ...p,
        status: newStatus as any,
        verified_by_admin: isApproved,
        verified_at: isApproved ? new Date().toISOString() : null
      } : p));

      toast.success(isApproved ? 'Partner Approved & Activated!' : 'Partner Application Rejected', {
        description: isApproved ? 'Partner now has full live dashboard and booking capability.' : 'Status recorded in database.'
      });
    } catch (err: any) {
      toast.error(err.message || 'Verification update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Setup Fee Paid
  const handleToggleSetupFee = async (partnerId: string, currentPaid: boolean) => {
    setUpdatingId(partnerId);
    try {
      const newPaid = !currentPaid;
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner',
          id: partnerId,
          setup_fee_paid: newPaid
        })
      });

      if (!res.ok) throw new Error('Failed to toggle setup fee');

      setPartners(prev => prev.map(p => p.id === partnerId ? {
        ...p,
        setup_fee_paid: newPaid,
        setup_fee_tx_id: newPaid ? `admin_manual_${Date.now()}` : null
      } : p));

      toast.success(newPaid ? 'Marked ₹3L Setup Fee as Paid' : 'Reset Setup Fee to Pending');
    } catch (err: any) {
      toast.error(err.message || 'Toggle failed');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Lounge Eligible on Property
  const handleToggleLounge = async (propertyId: string, currentEligible: boolean) => {
    try {
      const newEligible = !currentEligible;
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'property',
          id: propertyId,
          lounge_eligible: newEligible
        })
      });

      if (!res.ok) throw new Error('Failed to toggle lounge');

      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, lounge_eligible: newEligible } : p));
      toast.success(newEligible ? 'Gated Lounge Access Activated' : 'Lounge Access Deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Toggle failed');
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone && l.phone.includes(searchQuery)) ||
      (l.property_location && l.property_location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Partners
  const filteredPartners = partners.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.contract_city && p.contract_city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = partnerStatusFilter === 'all' || p.status === partnerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <AdminPageHeader
        title="Partner Network & Franchises"
        description="Inbound leads, ₹3L setup payments, 70/30 MoU contracts, statutory property NOC audits, and revenue splits."
        badge="Franchise Hub"
        actions={
          <>
            <button
              onClick={() => {
                setSearchQuery('');
                setLeadStatusFilter('all');
                setPartnerStatusFilter('all');
                toast.info('Refreshed partner records');
              }}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href="/franchise"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <span>View Public Franchise Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent-gold" />
            </a>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Inbound Franchise Leads"
          value={leads.length}
          subtext="Prospective hosts & property owners"
          icon={Users}
          highlightColor="gold"
          trend={leads.filter(l => l.status === 'new').length > 0 ? {
            value: `${leads.filter(l => l.status === 'new').length} New`,
            direction: 'up'
          } : undefined}
        />
        <AdminMetricCard
          label="Active Partner Hosts"
          value={partners.filter(p => p.status === 'active' || p.verified_by_admin).length}
          subtext="70/30 revenue-sharing partners"
          icon={ShieldCheck}
          highlightColor="emerald"
        />
        <AdminMetricCard
          label="Setup Fee Capital"
          value={`₹${(partners.filter(p => p.setup_fee_paid).length * 300000).toLocaleString('en-IN')}`}
          subtext={`${partners.filter(p => p.setup_fee_paid).length} partners paid ₹3L setup`}
          icon={CreditCard}
          highlightColor="gold"
        />
        <AdminMetricCard
          label="Pending KYC & NOC Audits"
          value={partners.filter(p => p.status === 'under_review' || (p.affidavit_uploaded && !p.verified_by_admin)).length}
          subtext="Requires manual statutory sign-off"
          icon={Clock}
          highlightColor={partners.filter(p => p.status === 'under_review' || (p.affidavit_uploaded && !p.verified_by_admin)).length > 0 ? 'amber' : 'gold'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {[
          { id: 'leads', label: `Inbound Leads (${leads.length})`, icon: MessageSquare },
          { id: 'partners', label: `Partner Profiles & Onboarding (${partners.length})`, icon: Users },
          { id: 'properties', label: `Partner Sanctuaries & 70/30 (${properties.length})`, icon: Building2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-accent-gold text-black font-bold shadow-lg'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, city, phone, email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 font-mono"
          />
        </div>

        {activeTab === 'leads' && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'new', 'contacted', 'converted', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setLeadStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  leadStatusFilter === st
                    ? 'bg-white/20 text-white font-bold border border-white/30'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'under_review', 'active', 'pending_payment', 'contract_pending', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setPartnerStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  partnerStatusFilter === st
                    ? 'bg-white/20 text-white font-bold border border-white/30'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: INBOUND FRANCHISE LEADS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {filteredLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLeads.map(lead => {
                const cleanDigits = (lead.phone || '').replace(/[^0-9]/g, '');
                const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                const waMessage = `Namaste ${lead.name}! ✨ We received your nothingness. Partner Application for ${lead.property_location || 'your property'}. We would love to discuss feasibility & setup.`;

                return (
                  <div key={lead.id} className="bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          lead.status === 'new' ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40' :
                          lead.status === 'contacted' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          lead.status === 'converted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {lead.status}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          {format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>

                      {/* Lead Title */}
                      <div>
                        <h3 className="font-serif text-xl text-white font-bold">{lead.name}</h3>
                        <p className="text-xs text-accent-gold font-mono flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{lead.property_location || 'Location Not Specified'}</span>
                        </p>
                      </div>

                      {/* Contacts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-white/70 pt-1">
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                          <Mail className="w-3.5 h-3.5 text-accent-gold" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
                          <Phone className="w-3.5 h-3.5 text-accent-gold" />
                          <span>{lead.phone || 'No Phone'}</span>
                        </div>
                      </div>

                      {/* Message / Specifications */}
                      {lead.message && (
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                          {lead.message}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-mono font-bold transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent('nothingness. Partner Application - Next Steps')}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          className="bg-zinc-900 border border-white/10 text-white text-[11px] font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent-gold/50"
                        >
                          <option value="new">Mark New</option>
                          <option value="contacted">Mark Contacted</option>
                          <option value="converted">Mark Converted</option>
                          <option value="rejected">Mark Rejected</option>
                        </select>

                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="font-serif text-lg text-white/50">No franchise leads matching search criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PARTNER PROFILES & COMPLIANCE PIPELINE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          {filteredPartners.length > 0 ? (
            <div className="space-y-4">
              {filteredPartners.map(partner => (
                <div key={partner.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                  
                  {/* Partner Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-2xl text-white font-bold">{partner.full_name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          partner.status === 'active' || partner.verified_by_admin ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          partner.status === 'under_review' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          partner.status === 'contract_pending' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                        }`}>
                          {partner.verified_by_admin ? 'Verified & Active' : partner.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 font-mono mt-1">
                        {partner.email} • {partner.phone} • Joined {format(new Date(partner.created_at), 'dd MMM yyyy')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!partner.verified_by_admin ? (
                        <button
                          onClick={() => handleVerifyPartner(partner.id, true)}
                          disabled={updatingId === partner.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Approve &amp; Activate Host</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyPartner(partner.id, false)}
                          disabled={updatingId === partner.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/60 border border-white/10 rounded-xl text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Revoke Verification</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Step Compliance Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Step 1: Setup Fee */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono uppercase text-white/40">Step 1: Setup Fee</span>
                        {partner.setup_fee_paid ? (
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ₹3L Paid
                          </span>
                        ) : (
                          <span className="text-amber-400 font-mono text-[10px]">Pending</span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 font-mono">
                        {partner.setup_fee_tx_id ? `Txn: ${partner.setup_fee_tx_id.slice(0, 16)}...` : 'Gateway order pending'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleSetupFee(partner.id, partner.setup_fee_paid)}
                        className="text-[10px] font-mono text-accent-gold hover:underline uppercase"
                      >
                        {partner.setup_fee_paid ? 'Mark Unpaid' : 'Manual Mark Paid (Admin)'}
                      </button>
                    </div>

                    {/* Step 2: MoU Contract */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono uppercase text-white/40">Step 2: 70/30 MoU</span>
                        {partner.contract_signed ? (
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                          </span>
                        ) : (
                          <span className="text-amber-400 font-mono text-[10px]">Pending</span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 font-mono truncate">
                        {partner.contract_signed_at ? `Signed ${format(new Date(partner.contract_signed_at), 'dd MMM yyyy')}` : 'Awaiting signature'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedPartnerForMou(partner)}
                        className="text-[10px] font-mono text-accent-gold hover:underline uppercase flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Contract MoU</span>
                      </button>
                    </div>

                    {/* Step 3: NOC Affidavit */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono uppercase text-white/40">Step 3: NOC Affidavit</span>
                        {partner.affidavit_uploaded ? (
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-amber-400 font-mono text-[10px]">Pending</span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 font-mono truncate">
                        {partner.affidavit_notes || 'Ownership draft'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedPartnerForAffidavit(partner)}
                        className="text-[10px] font-mono text-accent-gold hover:underline uppercase flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect Affidavit</span>
                      </button>
                    </div>

                  </div>

                  {/* Banking & Payout Settings */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-white/70">
                    <div>
                      <p className="text-[10px] uppercase text-white/40">Payout Frequency</p>
                      <p className="font-bold text-white uppercase mt-0.5">{partner.payout_frequency || 'Monthly'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/40">Bank Name</p>
                      <p className="text-white mt-0.5">{partner.bank_name || 'HDFC Bank Ltd.'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/40">A/C Number &amp; IFSC</p>
                      <p className="text-white mt-0.5">{partner.bank_account_number || '••••••••8912'} ({partner.bank_ifsc || 'HDFC0001234'})</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/40">UPI ID</p>
                      <p className="text-accent-gold mt-0.5">{partner.upi_id || 'partner@okhdfcbank'}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="font-serif text-lg text-white/50">No partner profiles found.</p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: PARTNER SANCTUARIES & 70/30 COMMERCIAL SPLIT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map(property => {
                const partnerProfile = property.partner_profiles;

                return (
                  <div key={property.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${
                          property.space_tier === 'luxury'
                            ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/30'
                            : 'bg-white/10 text-white border-white/20'
                        }`}>
                          {property.space_tier} Sanctuary
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                          Carpet: {property.carpet_area || '1,100 sq ft'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-xl text-white font-bold">{property.title}</h3>
                        <p className="text-xs text-white/60 font-mono flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                          <span>{property.locality}, {property.city} ({property.state})</span>
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 grid grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase">Partner Host</p>
                          <p className="text-white font-bold truncate">{partnerProfile?.full_name || 'Vetted Host Partner'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase">Commercial Model</p>
                          <p className="text-emerald-400 font-bold">70% Host / 30% Platform</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleLounge(property.id, property.lounge_eligible)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          property.lounge_eligible
                            ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40'
                            : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        <span>{property.lounge_eligible ? 'Lounge Active' : 'Enable Lounge'}</span>
                      </button>

                      <span className="text-[10px] font-mono text-white/40">
                        Turnover: {property.housekeeping_status}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
              <p className="font-serif text-lg text-white/50">No partner properties registered yet.</p>
            </div>
          )}
        </div>
      )}

      {/* MoU Modal for Admin Inspection */}
      {selectedPartnerForMou && (
        <PartnerMouContractModal
          partnerName={selectedPartnerForMou.full_name}
          partnerEmail={selectedPartnerForMou.email}
          city={selectedPartnerForMou.contract_city || 'National Capital Territory / Pan-India'}
          isOpen={!!selectedPartnerForMou}
          onClose={() => setSelectedPartnerForMou(null)}
          isReadOnly={true}
          signedAtDate={selectedPartnerForMou.contract_signed_at || selectedPartnerForMou.created_at}
          executedSignature={selectedPartnerForMou.full_name}
        />
      )}

      {/* Property NOC Affidavit Modal for Admin Inspection */}
      {selectedPartnerForAffidavit && (
        <PropertyNocAffidavitModal
          partnerName={selectedPartnerForAffidavit.full_name}
          propertyAddress={selectedPartnerForAffidavit.affidavit_notes || 'Registered Sanctuary'}
          city={selectedPartnerForAffidavit.contract_city || 'New Delhi'}
          isOpen={!!selectedPartnerForAffidavit}
          onClose={() => setSelectedPartnerForAffidavit(null)}
          onUploadSuccess={() => {}}
          isReadOnly={true}
          uploadedAffidavitUrl={selectedPartnerForAffidavit.affidavit_url || undefined}
        />
      )}

    </div>
  );
}
