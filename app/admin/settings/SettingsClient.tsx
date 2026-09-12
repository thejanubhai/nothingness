'use client';

import { useState } from "react";
import { 
  Settings2, Save, Clock, Percent, 
  Bot, Megaphone, Flame, ArrowUpRight, CheckCircle2,
  Key, Eye, EyeOff, ExternalLink, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import RegisterPasskeyButton from "@/components/RegisterPasskeyButton";

type SettingsType = {
  id: string;
  maintenance_mode: boolean;
  admin_contact_email: string;
  default_check_in_time: string;
  default_check_out_time: string;
  min_advance_booking_days: number;
  max_advance_booking_days: number;
  cancellation_policy_text: string | null;
  base_tax_rate_percent: number;
  default_security_deposit: number;
  ai_system_prompt: string | null;
  gemini_api_key?: string | null;
  nvidia_api_key?: string | null;
  frontend_banner_text: string | null;
  frontend_banner_active: boolean;
  fee_id_verification?: number;
  fee_kinkster_activation?: number;
  fee_partner_onboarding?: number;
};

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsType | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'kinksters' | 'policies' | 'financials' | 'ai'>('general');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);
  
  // Initialize with empty/default values if null
  const [formData, setFormData] = useState<SettingsType>(initialSettings || {
    id: '',
    maintenance_mode: false,
    admin_contact_email: 'admin@nothingness.asia',
    default_check_in_time: '14:00',
    default_check_out_time: '11:00',
    min_advance_booking_days: 0,
    max_advance_booking_days: 180,
    cancellation_policy_text: '',
    base_tax_rate_percent: 18.0,
    default_security_deposit: 0,
    fee_id_verification: 0,
    fee_kinkster_activation: 0,
    fee_partner_onboarding: 300000,
    ai_system_prompt: '',
    gemini_api_key: '',
    nvidia_api_key: '',
    frontend_banner_text: '',
    frontend_banner_active: false,
  });

  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify(initialSettings || {})
  );

  const hasChanges = JSON.stringify(formData) !== savedSnapshot;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      if (data.settings?.id) {
        setFormData(prev => ({ ...prev, id: data.settings.id }));
      }
      setSavedSnapshot(JSON.stringify(formData));
      
      toast.success('Settings updated successfully in Supabase!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings2 },
    { id: 'kinksters', name: 'Lifestyle & Kinksters', icon: Flame },
    { id: 'policies', name: 'Bookings & Policies', icon: Clock },
    { id: 'financials', name: 'Financials', icon: Percent },
    { id: 'ai', name: 'AI Engine', icon: Bot },
  ] as const;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl md:text-4xl text-white">Platform Settings</h1>
            {hasChanges ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
                ● Unsaved Changes
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced with Database
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm tracking-wide mt-1">Configure integrations, policies, and global preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl cursor-pointer disabled:opacity-50 ${
            hasChanges
              ? 'bg-accent-gold hover:bg-white text-black ring-2 ring-accent-gold/50'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : hasChanges ? 'Save Changes' : 'Save Settings'}
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-white/10 gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-accent-gold text-accent-gold' 
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        
        {/* GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="font-serif text-xl text-white mb-6 border-b border-white/10 pb-4">System Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Maintenance Mode</label>
                  <select 
                    value={formData.maintenance_mode ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, maintenance_mode: e.target.value === 'true'})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50"
                  >
                    <option value="false" className="bg-black text-white">System Online (Normal Operations)</option>
                    <option value="true" className="bg-black text-white">Maintenance Mode (Offline)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Admin Contact Email</label>
                  <input 
                    type="email" 
                    value={formData.admin_contact_email}
                    onChange={(e) => setFormData({...formData, admin_contact_email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <Megaphone className="w-5 h-5 text-accent-gold" />
                <h2 className="font-serif text-xl text-white">Frontend Banner</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.frontend_banner_active}
                    onChange={(e) => setFormData({...formData, frontend_banner_active: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 text-accent-gold focus:ring-accent-gold bg-transparent"
                  />
                  <span className="text-sm text-white">Enable Global Banner</span>
                </label>
                
                {formData.frontend_banner_active && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Banner Text</label>
                    <input 
                      type="text" 
                      value={formData.frontend_banner_text || ''}
                      onChange={(e) => setFormData({...formData, frontend_banner_text: e.target.value})}
                      placeholder="e.g. Use code SUMMER10 for 10% off!"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Admin Biometrics & Security */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="font-serif text-xl text-white mb-4">Admin Biometrics &amp; Passkey</h2>
              <p className="text-xs text-white/50 mb-4">
                Enroll this device to access the Admin Command Center using FaceID, TouchID, or Windows Hello. Once enrolled, you can sign in directly from the login portal with 1-click biometrics.
              </p>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 max-w-lg">
                <RegisterPasskeyButton />
              </div>
            </div>
          </div>
        )}

        {/* LIFESTYLE & KINKSTERS SETTINGS */}
        {activeTab === 'kinksters' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h2 className="font-serif text-xl text-white">The Circle &amp; Entry Barrier</h2>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Manage the private sanctuary social network and configure the one-time paid entry barrier for members.
                </p>
              </div>
              <a
                href="/kinksters"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs transition-colors self-start md:self-auto"
              >
                <span>View Member Page</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
              </a>
            </div>

            {/* Main Entry Fee Card */}
            <div className="bg-gradient-to-br from-rose-950/20 via-black to-purple-950/20 border border-rose-500/20 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 block mb-1">
                    Primary Membership Barrier
                  </span>
                  <h3 className="text-lg font-bold text-white">One-Time Lifetime Entry Fee</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Every member pays this one-time fee before launching their private @alias. Setting this fee establishes an exclusive barrier that eliminates bots, casual lurkers, and non-serious tourists.
                  </p>
                </div>
                <div className="px-4 py-2 bg-black/60 border border-rose-500/30 rounded-xl text-right shrink-0">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block">Active Fee</span>
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {Number(formData.fee_kinkster_activation) > 0
                      ? `₹${Number(formData.fee_kinkster_activation).toLocaleString('en-IN')}`
                      : 'Free Entry (₹0)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-2 block">
                  Entry Barrier Amount (₹ INR)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-3 text-zinc-400 font-mono text-base">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.fee_kinkster_activation ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, fee_kinkster_activation: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-base focus:outline-none focus:border-rose-500 transition-colors"
                      placeholder="e.g. 4999"
                    />
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: 'Free (₹0)', val: 0 },
                      { label: '₹1,999', val: 1999 },
                      { label: '₹2,999', val: 2999 },
                      { label: '₹4,999', val: 4999 },
                      { label: '₹9,999', val: 9999 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, fee_kinkster_activation: preset.val })}
                        className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all ${
                          formData.fee_kinkster_activation === preset.val
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Changes take effect immediately on <span className="font-mono text-rose-300">/kinksters</span> once you click "Save Settings".
                </p>
              </div>

              {/* Live Card Preview */}
              <div className="pt-4 border-t border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-3">
                  Live Member Display Preview
                </span>
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">The Sovereign Pass</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        Lifetime Membership
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Private @alias, vetted member feed, mutual spark discovery, and secret sanctuary access.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold font-mono text-rose-400">
                      {Number(formData.fee_kinkster_activation) > 0
                        ? `₹${Number(formData.fee_kinkster_activation).toLocaleString('en-IN')}`
                        : 'Complimentary'}
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-mono">One-time payment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vetting Criteria Notice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4" /> Discretion &amp; Identity Verification
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Real names are never revealed publicly. Every member is verified with Aadhaar or Passport to preserve mutual safety and ensure legal hospitality compliance.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4" /> Sanctuary Stay Requirement
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Only individuals and couples who have stayed at Nothingness can complete onboarding, maintaining an intimate, respectful circle of guests who appreciate the culture.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS & POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="font-serif text-xl text-white mb-6 border-b border-white/10 pb-4">Operating Times</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Default Check-in Time</label>
                  <input 
                    type="time" 
                    value={formData.default_check_in_time}
                    onChange={(e) => setFormData({...formData, default_check_in_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Default Check-out Time</label>
                  <input 
                    type="time" 
                    value={formData.default_check_out_time}
                    onChange={(e) => setFormData({...formData, default_check_out_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50 [color-scheme:dark]" 
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl text-white mb-6 border-b border-white/10 pb-4">Booking Windows</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Min Advance Notice (Days)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.min_advance_booking_days}
                    onChange={(e) => setFormData({...formData, min_advance_booking_days: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                  <p className="text-xs text-white/30 mt-1">0 = allow same-day bookings</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Max Advance Booking (Days)</label>
                  <input 
                    type="number" 
                    min={1}
                    value={formData.max_advance_booking_days}
                    onChange={(e) => setFormData({...formData, max_advance_booking_days: parseInt(e.target.value) || 180})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                  <p className="text-xs text-white/30 mt-1">How far in advance guests can book</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl text-white mb-6 border-b border-white/10 pb-4">Cancellation Policy</h2>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Default Policy Text</label>
                <textarea 
                  rows={4}
                  value={formData.cancellation_policy_text || ''}
                  onChange={(e) => setFormData({...formData, cancellation_policy_text: e.target.value})}
                  placeholder="e.g. Full refund up to 5 days before check-in..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                />
              </div>
            </div>
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === 'financials' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="font-serif text-xl text-white mb-6 border-b border-white/10 pb-4">Tax & Deposit Defaults</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Base Tax Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.base_tax_rate_percent}
                    onChange={(e) => setFormData({...formData, base_tax_rate_percent: parseFloat(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Default Security Deposit (₹)</label>
                  <input 
                    type="number" 
                    value={formData.default_security_deposit}
                    onChange={(e) => setFormData({...formData, default_security_deposit: parseFloat(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                </div>
              </div>
            </div>

            {/* Action Pricing & User Action Fees */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="font-serif text-xl text-white mb-2">User Action Pricing &amp; Gateway Fees</h2>
              <p className="text-xs text-white/40 mb-6">Configure real-time fees charged for user-initiated platform workflows. Setting a fee to ₹0 allows instant free completion.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-accent-gold font-bold block">ID Verification Fee (₹)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.fee_id_verification ?? 0}
                    onChange={(e) => setFormData({...formData, fee_id_verification: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                  <p className="text-[11px] text-white/40 leading-tight">One-time fee for 180-day Police Compliance ID pass verification. Set ₹0 for Free.</p>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/20 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold block">Kinkster Lifetime Pass</span>
                    <p className="text-2xl font-bold font-mono text-white mt-1">
                      {Number(formData.fee_kinkster_activation) > 0
                        ? `₹${Number(formData.fee_kinkster_activation).toLocaleString('en-IN')}`
                        : 'Free Entry (₹0)'}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-tight mt-1">
                      Configured in the dedicated Lifestyle &amp; Kinksters studio with presets &amp; live member preview.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kinksters')}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer self-start"
                  >
                    <span>Manage in Lifestyle Tab</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-accent-gold font-bold block">Partner Onboarding Fee (₹)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.fee_partner_onboarding ?? 300000}
                    onChange={(e) => setFormData({...formData, fee_partner_onboarding: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                  />
                  <p className="text-[11px] text-white/40 leading-tight">One-time setup fee for property partners (branding, hardware, valet &amp; ops setup). Default ₹3,00,000.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI ENGINE */}
        {activeTab === 'ai' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <Bot className="w-5 h-5 text-accent-gold" />
                <h2 className="font-serif text-xl text-white">Multimodal Vision &amp; AI Engine Credentials</h2>
              </div>

              {/* Vision AI API Keys Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Google Gemini */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Google Gemini API</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Recommended OCR
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Powers automatic ID autofill (Aadhaar &amp; Passport extraction), event vetting, and smart chatbot responses.
                  </p>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 block">API Key</label>
                    <div className="relative">
                      <input
                        type={showGeminiKey ? "text" : "password"}
                        value={formData.gemini_api_key || ''}
                        onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-accent-gold/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                        title={showGeminiKey ? "Hide key" : "Show key"}
                      >
                        {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                    <span>Free tier: up to 15 requests/min</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-gold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Get Free Gemini Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* NVIDIA NIM */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-accent-gold" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">NVIDIA NIM API</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-accent-gold/10 text-accent-gold border border-accent-gold/20 font-bold">
                      Vision OCR &amp; Editorial
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Powers zero-cost Foundation Model OCR (Llama 3.2 Vision) and high-authority editorial article generation.
                  </p>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 block">API Key</label>
                    <div className="relative">
                      <input
                        type={showNvidiaKey ? "text" : "password"}
                        value={formData.nvidia_api_key || ''}
                        onChange={(e) => setFormData({ ...formData, nvidia_api_key: e.target.value })}
                        placeholder="nvapi-..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pr-10 text-sm text-white font-mono focus:outline-none focus:border-accent-gold/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNvidiaKey(!showNvidiaKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                        title={showNvidiaKey ? "Hide key" : "Show key"}
                      >
                        {showNvidiaKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                    <span>1,000 free inference credits included</span>
                    <a
                      href="https://build.nvidia.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-gold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Get NVIDIA Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Master System Prompt */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Master System Prompt</label>
                <textarea 
                  rows={8}
                  value={formData.ai_system_prompt || ''}
                  onChange={(e) => setFormData({...formData, ai_system_prompt: e.target.value})}
                  placeholder="You are a helpful assistant..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-accent-gold/50 font-mono" 
                />
                <p className="text-xs text-white/30 mt-2">This prompt governs the personality and strict boundaries of your AI chatbot across all omnichannel integrations.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
