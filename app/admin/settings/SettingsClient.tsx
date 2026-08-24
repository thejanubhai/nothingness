'use client';

import { useState } from "react";
import { 
  Settings2, Key, Shield, Save, Clock, Percent, 
  Bot, Megaphone, Smartphone, CreditCard, Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  frontend_banner_text: string | null;
  frontend_banner_active: boolean;
  whatsapp_api_key: string | null;
  cashfree_app_id: string | null;
  cashfree_secret_key: string | null;
  resend_api_key: string | null;
  gemini_api_key: string | null;
};

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsType | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'policies' | 'financials' | 'ai' | 'api'>('general');
  
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
    ai_system_prompt: '',
    frontend_banner_text: '',
    frontend_banner_active: false,
    whatsapp_api_key: '',
    cashfree_app_id: '',
    cashfree_secret_key: '',
    resend_api_key: '',
    gemini_api_key: '',
  });

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
    { id: 'policies', name: 'Bookings & Policies', icon: Clock },
    { id: 'financials', name: 'Financials', icon: Percent },
    { id: 'ai', name: 'AI Engine', icon: Bot },
    { id: 'api', name: 'API Keys', icon: Key },
  ] as const;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Platform Settings</h1>
          <p className="text-white/50 text-sm tracking-wide">Configure integrations, policies, and global preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-accent-gold text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Settings'}
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
          </div>
        )}

        {/* AI ENGINE */}
        {activeTab === 'ai' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                <Bot className="w-5 h-5 text-accent-gold" />
                <h2 className="font-serif text-xl text-white">AI Agent Configuration</h2>
              </div>
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

        {/* API KEYS */}
        {activeTab === 'api' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-500 font-medium text-sm">Security Notice</h3>
                  <p className="text-amber-500/70 text-xs mt-1">API keys entered here will override your `.env` variables and be stored in the database. Ensure your admin portal is securely restricted.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-4 h-4 text-white/50" />
                  <h3 className="text-white font-medium">WhatsApp Business API</h3>
                </div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Access Token</label>
                <input 
                  type="password" 
                  value={formData.whatsapp_api_key || ''}
                  onChange={(e) => setFormData({...formData, whatsapp_api_key: e.target.value})}
                  placeholder="EAA..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                />
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-white/50" />
                  <h3 className="text-white font-medium">Cashfree Payments</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">App ID</label>
                    <input 
                      type="text" 
                      value={formData.cashfree_app_id || ''}
                      onChange={(e) => setFormData({...formData, cashfree_app_id: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Secret Key</label>
                    <input 
                      type="password" 
                      value={formData.cashfree_secret_key || ''}
                      onChange={(e) => setFormData({...formData, cashfree_secret_key: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-white/50" />
                  <h3 className="text-white font-medium">Resend Email</h3>
                </div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">API Key</label>
                <input 
                  type="password" 
                  value={formData.resend_api_key || ''}
                  onChange={(e) => setFormData({...formData, resend_api_key: e.target.value})}
                  placeholder="re_..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                />
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-4 h-4 text-white/50" />
                  <h3 className="text-white font-medium">Gemini AI</h3>
                </div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">API Key</label>
                <input 
                  type="password" 
                  value={formData.gemini_api_key || ''}
                  onChange={(e) => setFormData({...formData, gemini_api_key: e.target.value})}
                  placeholder="AIza..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-accent-gold/50" 
                />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
